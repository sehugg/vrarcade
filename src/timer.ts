const useRequestAnimationFrame = false;

export class AnimationTimer {

    callback;
    running: boolean = false;
    pulsing: boolean = false;
    nextts = 0;
    nframes : number = 0;
    startts : number = 0; // for FPS calc
    frameRate;
    intervalMsec;
    useReqAnimFrame = useRequestAnimationFrame && typeof window.requestAnimationFrame === 'function'; // need for unit test

    constructor(frequencyHz: number, callback: () => void) {
        this.frameRate = frequencyHz;
        this.intervalMsec = 1000.0 / frequencyHz;
        this.callback = callback;
    }

    scheduleFrame(msec: number) {
        var fn = (timestamp: number) => {
            try {
                this.nextFrame(this.useReqAnimFrame ? timestamp : Date.now());
            } catch (e) {
                this.running = false;
                this.pulsing = false;
                throw e;
            }
        }
        if (this.useReqAnimFrame)
            window.requestAnimationFrame(fn);
        else
            setTimeout(fn, msec);
    }
    nextFrame(ts: number) {
        if (ts > this.nextts) {
            if (this.running) {
                this.callback();
            }
            if (this.nframes == 0)
                this.startts = ts;
            if (this.nframes++ == 300) {
                console.log("Avg framerate: " + this.nframes * 1000 / (ts - this.startts) + " fps");
            }
        }
        this.nextts += this.intervalMsec;
        // frames skipped? catch up
        if ((ts - this.nextts) > 1000) {
            //console.log(ts - this.nextts, 'msec skipped');
            this.nextts = ts;
        }
        if (this.running) {
            this.scheduleFrame(this.nextts - ts);
        } else {
            this.pulsing = false;
        }
    }
    isRunning() {
        return this.running;
    }
    start() {
        if (!this.running) {
            this.running = true;
            this.nextts = 0;
            this.nframes = 0;
            if (!this.pulsing) {
                this.scheduleFrame(0);
                this.pulsing = true;
            }
        }
    }
    stop() {
        this.running = false;
    }
}

