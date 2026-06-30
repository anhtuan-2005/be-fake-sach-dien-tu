'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
    ALTER TABLE assignments 
    ADD COLUMN duration VARCHAR(50) DEFAULT '7d' AFTER color;
  `).then(function() {
    return db.runSql(`
      ALTER TABLE assignments 
      ADD COLUMN due_date TIMESTAMP NULL AFTER duration;
    `);
  });
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE assignments 
    DROP COLUMN due_date;
  `).then(function() {
    return db.runSql(`
      ALTER TABLE assignments 
      DROP COLUMN duration;
    `);
  });
};

exports._meta = {
  "version": 1
};
