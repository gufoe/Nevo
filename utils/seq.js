class Seq {
    constructor (size) {
        this.size = size
        this.reset()
    }

    reset() {
        this.data = []
        range(this.size, () => this.data.push(NaN))
    }

    push(val) {
        if (this.min === undefined || val < this.min) this.min = val
        if (this.max === undefined || val > this.max) this.max = val
        this.data.push(val)
        if (this.size && this.data.length > this.size) {
            this.data.splice(0, 1)
        }
    }

    draw(x, y, h, w, color, min, max) {
        drawGraph(
            '', this.data, x, y, h, w, color,
            typeof min == 'number' ? min : this.min,
            typeof max == 'number' ? max : this.max
        )
    }
}
