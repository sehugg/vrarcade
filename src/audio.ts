
// @ts-nocheck 

var SampleAudio = function (clockfreq: number) {
    var self = this;
    var sfrac, sinc, accum;
    var buffer, bufpos, bufferlist;
    var idrain, ifill;
    var nbuffers = 4;

    function mix(ape) {
        var buflen = ape.outputBuffer.length;
        var lbuf = ape.outputBuffer.getChannelData(0);
        var m = this.module;
        if (!m) m = ape.srcElement.module;
        if (!m) return;
        if (m.callback) {
            m.callback(lbuf);
            return;
        } else {
            var buf = bufferlist[idrain];
            for (var i = 0; i < lbuf.length; i++) {
                lbuf[i] = buf[i];
                //lbuf[i] = (i&128) ? 1.0 : 0.33;
            }
            idrain = (idrain + 1) % bufferlist.length;
        }
    }

    function clearBuffers() {
        if (bufferlist)
            for (var buf of bufferlist)
                buf.fill(0);
    }

    function createContext() {
        var AudioContext = window['AudioContext'] || window['webkitAudioContext'] || window['mozAudioContext'];
        if (!AudioContext) {
            console.log("no web audio context");
            return;
        }
        var ctx: AudioContext = new AudioContext();
        self.context = ctx;
        self.sr = self.context.sampleRate;
        self.bufferlen = 2048;

        // remove DC bias
        self.filterNode = self.context.createBiquadFilter();
        self.filterNode.type = 'lowshelf';
        self.filterNode.frequency.value = 100;
        self.filterNode.gain.value = -6;

        // mixer
        if (typeof self.context.createScriptProcessor === 'function') {
            self.mixerNode = self.context.createScriptProcessor(self.bufferlen, 1, 1);
        } else {
            self.mixerNode = self.context.createJavaScriptNode(self.bufferlen, 1, 1);
        }

        self.mixerNode.module = self;
        self.mixerNode.onaudioprocess = mix;

        // compressor for a bit of volume boost, helps with multich tunes
        self.compressorNode = self.context.createDynamicsCompressor();

        // patch up some cables :)
        self.mixerNode.connect(self.filterNode);
        self.filterNode.connect(self.compressorNode);
        self.compressorNode.connect(self.context.destination);
    }

    this.start = function () {
        if (this.context) {
            // Chrome autoplay (https://goo.gl/7K7WLu)
            if (this.context.state == 'suspended') {
                this.context.resume();
            }
            return;   // already created
        }
        createContext();            // create it
        if (!this.context) return;  // not created?
        sinc = this.sr * 1.0 / clockfreq;
        sfrac = 0;
        accum = 0;
        bufpos = 0;
        bufferlist = [];
        idrain = 1;
        ifill = 0;
        for (var i = 0; i < nbuffers; i++) {
            var arrbuf = new ArrayBuffer(self.bufferlen * 4);
            bufferlist[i] = new Float32Array(arrbuf);
        }
        buffer = bufferlist[0];
    }

    this.stop = function () {
        this.context && this.context.suspend && this.context.suspend();
        clearBuffers(); // just in case it doesn't stop immediately
    }

    this.close = function () {
        if (this.context) {
            this.context.close();
            this.context = null;
        }
    }

    this.addSingleSample = function (value) {
        if (!buffer) return;
        buffer[bufpos++] = value;
        if (bufpos >= buffer.length) {
            bufpos = 0;
            bufferlist[ifill] = buffer;
            var inext = (ifill + 1) % bufferlist.length;
            if (inext == idrain) {
                ifill = Math.floor(idrain + nbuffers / 2) % bufferlist.length;
                //console.log('SampleAudio: skipped buffer', idrain, ifill); // TODO
            } else {
                ifill = inext;
            }
            buffer = bufferlist[ifill];
        }
    }

    this.feedSample = function (value, count) {
        accum += value * count;
        sfrac += sinc * count;
        if (sfrac >= 1) {
            accum /= sfrac;
            while (sfrac >= 1) {
                this.addSingleSample(accum * sinc);
                sfrac -= 1;
            }
            accum *= sfrac;
        }
    }

}


export class SampledAudio {
    sa;
    started = false;
    constructor(sampleRate: number) {
        this.sa = new SampleAudio(sampleRate);
    }
    feedSamples(samples: Float32Array) {
        for (var i = 0; i < samples.length; i++) {
            this.sa.feedSample(samples[i], 1);
        }
    }
    feedSample(value: number, count: number) {
        this.sa.feedSample(value, count);
    }
    start() {
        if (this.started) return;
        this.started = true;
        this.sa.start();
    }
    stop() {
        if (!this.started) return;
        this.started = false;
        this.sa.stop();
    }
}
