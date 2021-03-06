// This code runs once per frame. Build units and command peasants!
Base.prototype.run = function() {

// forward declaration to constant and function 
if (this.functionDeclared === undefined) {
	// constants
	this.ENEMY_CLOSE_DISTANCE = 30;
	this.TIME_MID_GAME = 60;
	this.TIME_LATE_GAME = 120;
	this.MAP_WIDTH = 85;
	this.MAP_HEIGHT = 70;
	this.MAP_WIDTH13 = Math.floor(this.MAP_WIDTH / 3);
	this.MAP_WIDTH23 = Math.floor(this.MAP_WIDTH * 2 / 3);
	this.MAP_HEIGHT13 = Math.floor(this.MAP_HEIGHT / 3);
	this.MAP_HEIGHT23 = Math.floor(this.MAP_HEIGHT * 2 / 3);
	this.MAP_CENTER = { x:Math.floor(this.MAP_WIDTH/2), y:Math.floor(this.MAP_HEIGHT/2) };
	// [x1, y1, x2, y2]
	this.MAP_REGIONS = [
		[0, 0, this.MAP_WIDTH13, this.MAP_HEIGHT13],
		[this.MAP_WIDTH13, 0, this.MAP_WIDTH23, this.MAP_HEIGHT13],
		[this.MAP_WIDTH23, 0, this.MAP_WIDTH, this.MAP_HEIGHT13],
		[0, this.MAP_HEIGHT13, this.MAP_WIDTH13, this.MAP_HEIGHT23],
		[this.MAP_WIDTH13, this.MAP_HEIGHT13, this.MAP_WIDTH23, this.MAP_HEIGHT23],
		[this.MAP_WIDTH23, this.MAP_HEIGHT13, this.MAP_WIDTH, this.MAP_HEIGHT23],
		[0, this.MAP_HEIGHT23, this.MAP_WIDTH13, this.MAP_HEIGHT],
		[this.MAP_WIDTH13, this.MAP_HEIGHT23, this.MAP_WIDTH23, this.MAP_HEIGHT],
		[this.MAP_WIDTH23, this.MAP_HEIGHT23, this.MAP_WIDTH, this.MAP_HEIGHT],
	];
	
	// two-dimension array. 1st dimension is number of peasant, 
	// the 2nd dimension is which region the peasont should go
	this.PEASANT_REGIONS = [
		[],
		[4],
	];

	// functions
	this.functionDeclared = true;
	this.divideItemsBy9 = function(items, regions) {};
	this.getEnemySoliders = function() {};
	this.itemBelongsToRegionBy9 = function(item, region) {};
	this.movePeasants = function(allItems) {};
	this.positionToRegionBy9 = function(pos) {};
	this.situationSetup = function() {};
	this.situationUpdate = function() {};
	this.unitToBuild = function(situation) {};
	this.withinRegionBy9 = function(pos, inRegion, regions) {};
}

var units = ['soldier', 'knight', 'librarian', 'griffin-rider', 'captain'];

// an injectable object for tests
if (this.situation === undefined) {
	this.situation = this.situationSetup();
}

// situation changes every turn so we need to update
this.situationUpdate(this.situation);

// peasants move independ to situation and military units
this.movePeasants(this.getItems());

this.unitToBuild(this.situation);

if (this.functionDefined === undefined) {
	this.functionDefined = true;

/**
 * try to divide items into 9 regions
 * 
 *
 * @return an array of array of items
 */
this.divideItemsBy9 = function(items) {
	var regions = [[], [], [],[], [], [],[], [], [],];
	for (var i = 0; i < items.length; i++) {
		regions[this.positionToRegionBy9(items[i].pos)].push(items[i]);
	}
	return regions;
}; // end divideItemsBy9

this.getEnemySoliders = function() {
    // this includes peon, not what we really want
    var enemies = this.getEnemies();
    var soliders = [];
    if (enemies !== undefined) {
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].type !== "peon") {
                soliders.push(enemies[i]);
            }
        }
    }
    return soliders;
}; // end getEnemySoliders()

/**
 * A helper function to check whether item is belongs to region
 *
 * @param item Item object
 * @param int index of region
 *
 * @return boolean
 */
this.itemBelongsToRegionBy9 = function(item, region) {
	return this.withinRegionBy9(item.pos, this.MAP_REGIONS[region]);
} // end itemBelongsToRegionBy9(item, region)

this.movePeasants = function(allItems) {
	// fair distrubion - segementize items into 9 square. peasants get nearest item base on its square
	var itemsByRegion = this.divideItemsBy9(allItems);

	var peasants = this.getByType('peasant');
	for (var peasantIndex = 0; peasantIndex < peasants.length; peasantIndex++) {
		var peasant = peasants[peasantIndex];
		
		// filter out items that are close to other peasants
		// or
		// increase vector of item by other peasant's vector
		
		var items = itemsByRegion[this.PEASANT_REGIONS[peasants.length][peasantIndex]];
		
		// decide whether he should go for higher value item
		if (peasant !== undefined) {
			var item = peasant.getNearest(items);
			if (item) {
				this.command(peasant, 'move', item.pos);
			}
		}
	} // for
}; // end movePeasants()

/**
 * @return object with situation
 */
this.situationSetup = function() {
	var situation = new Object();
	situation.warStarted = false;
	situation.enemyIsNear = false;
	
	// middle of the game, a point where building more peasants is pointless.
	// we should save money or start to build unit
	situation.midGame = false;
	
	// the game is going to end. The game would lose/draw if we do not start to destroy the enemy base
	situation.lateGame = false;
	
	return situation;
};// end situationSetup()

this.situationUpdate = function(situation) {
	situation.midGame = this.now() > this.TIME_MID_GAME;
	situation.lateGame = this.now() > this.TIME_LATE_GAME;
	
	var enemySoliders = this.getEnemySoliders();
	var nearestEnemy = this.getNearest(enemySoliders);

	if (nearestEnemy !== undefined) {
		var closestDist = this.pos.distance(nearestEnemy.pos);
		situation.enemyIsNear = closestDist < this.ENEMY_CLOSE_DISTANCE;
	}
	
	if (situation.lastGame || situation.enemyIsNear) {
		if (!situation.warStarted) {
			this.say('war started!');
			situation.warStarted = true;
		}
	}
}; // end situationUpdate()

/**
 * Decide what unit to build base on the situation
 *
 * @return unit type that we want to build
 */
this.unitToBuild = function(situation) {
	// save money for later
	if (!situation.enemyIsNear && situation.midGame) {
		return undefined;
	}
	
	var type = 'peasant';
	if (situation.enemyIsNear || situation.warStarted) {
		type = units[Math.floor(Math.random() * units.length)];
	}

	// build if we have enough gold
	if (type !== undefined) {
		if (this.gold >= this.buildables[type].goldCost)
			this.build(type);
	}
	
	return type;
}; // end unitToBuild()

/**
 * @param pos Position object
 * @param region coordinates [x1, y1, x2, y2] for checking
 *
 * @return boolean
 */
this.withinRegionBy9 = function(pos, region) {
	if (pos.x < region[0]) return false;
	if (pos.x >= region[2]) return false;
	if (pos.y < region[1]) return false;
	if (pos.y >= region[3]) return false;
	return true;
}; // end withinRegionBy9()


} // end if functionDefined

}; // end Base.prototype.run