//Simple Vector class
class Vector {
	constructor(x, y) {
		this.x = x instanceof Vector ? x.x : x
		this.y = x instanceof Vector ? x.y : y
    }

    add(v) { return new Vector(this.x + (v instanceof Vector ? v.x : v), this.y + (v instanceof Vector ? v.y : v)) }
    sub(v) { return new Vector(this.x - (v instanceof Vector ? v.x : v), this.y - (v instanceof Vector ? v.y : v)) }
    div(v) { return new Vector(this.x / v, this.y / v) }
    mult(v) { return new Vector(this.x * v, this.y * v) }
	dot(v) { return this.x * v.x + this.y * v.y }
	cross(v) { return this.x * v.y + this.y * v.x }

	toString() {
		return `${this.x} ${this.y}`
	}

	*[Symbol.iterator]() {
        yield this.x
		yield this.y
    }

    angleTo(vec) {
        return Math.atan2(vec.y - this.y, vec.x - this.x)
    }

    dist(vec) {
        return Math.hypot(vec.y - this.y, vec.x - this.x)
    }

    static average() {
        let sum = [...arguments].reduce((a, v)=> {
			return a.add(v)
		})
        return sum.div(arguments.length)
    }

	static angMag(a, m) {
		return new Vector(Math.cos(a) * m, Math.sin(a) * m)
	}
}
