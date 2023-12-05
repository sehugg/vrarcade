DESTPATH=8bitws:/var/www/html/puzzlingplans.com/vrarcade
npm run build
rsync --stats --delete -avz --chmod=a+rx -e "ssh" ./dist/* $DESTPATH/
