function Time() {
    this.secondsElapsedSinceStart = 0;
    this.lastTime = 0;
    this.deltaTime = 0;
    //mercury venus earth moon mars jupiter saturn uranus neptune
    this.mercury = 0;
    this.venus = 0;
    this.earth = 0;
    this.earthaxis = 0;
    this.moon = 0;
    this.mars = 0;
    this.jupiter = 0;
    this.saturn = 0;
    this.uranus = 0;
    this.neptune = 0;
    this.sun = 0;

    this.update = function() {
        var currentTime = new Date().getTime();
        if (this.lastTime != 0) {
            this.deltaTime = (currentTime - this.lastTime) / 1000.0;
            this.secondsElapsedSinceStart += this.deltaTime;
            this.mercury = (this.secondsElapsedSinceStart/3);
            this.venus = (this.secondsElapsedSinceStart/4);
            this.earth = (this.secondsElapsedSinceStart/9);
            this.earthaxis = (this.secondsElapsedSinceStart/20);
            this.moon = (this.secondsElapsedSinceStart/2);
            this.mars = (this.secondsElapsedSinceStart/21);
            this.jupiter = (this.secondsElapsedSinceStart/45);
            this.saturn = (this.secondsElapsedSinceStart/31);
            this.uranus = (this.secondsElapsedSinceStart/15);
            this.neptune = (this.secondsElapsedSinceStart/24);
            this.sun = (this.secondsElapsedSinceStart/55);
        }
        this.lastTime = currentTime;
    }
}