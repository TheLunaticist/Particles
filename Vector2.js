class Vector2 {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	
	getLength() {
		return Math.sqrt(Math.pow(this.x, 2), Math.pow(this.y, 2));
	}
	
	getNormalized() {
		let length = this.getLength();
		return new Vector2(this.x / length, this.y / length);
	}
	
	static add(vectorA, vectorB) {
		return new Vector2(vectorA.x + vectorB.x, vectorA.y + vectorB.y);
	}
	
	static subtract(vectorA, vectorB) {
		return new Vector2(vectorA.x - vectorB.x, vectorA.y - vectorB.y);
	}
	
	static scaleVec(vector, scale) {
		return new Vector2(vector.x * scale, vector.y * scale);
	}
}