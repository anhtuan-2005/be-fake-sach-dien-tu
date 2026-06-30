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
    ALTER TABLE assignment_students 
    ADD COLUMN answers JSON NULL AFTER feedback;
  `);
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE assignment_students 
    DROP COLUMN answers;
  `);
};

exports._meta = {
  "version": 1
};
