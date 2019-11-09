'use strict';

const _ = require('lodash');
const AbstractDialect = require('../abstract');
const ConnectionManager = require('./connection-manager');
const Query = require('./query');
const QueryGenerator = require('../sqlite/query-generator');
const DataTypes = require('../../data-types').rqlite;

class RqliteDialect extends AbstractDialect {
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new ConnectionManager(this, sequelize);
    this.QueryGenerator = new QueryGenerator({
      _dialect: this,
      sequelize
    });
  }
}

RqliteDialect.prototype.supports = _.merge(_.cloneDeep(AbstractDialect.prototype.supports), {
  'DEFAULT': false,
  'DEFAULT VALUES': true,
  'UNION ALL': false,
  'RIGHT JOIN': false,
  inserts: {
    ignoreDuplicates: ' OR IGNORE',
    updateOnDuplicate: ' ON CONFLICT DO UPDATE SET'
  },
  index: {
    using: false,
    where: true,
    functionBased: true
  },
  transactionOptions: {
    type: true
  },
  constraints: {
    addConstraint: false,
    dropConstraint: false
  },
  joinTableDependent: false,
  groupedLimit: false,
  JSON: true
});

ConnectionManager.prototype.defaultVersion = '3.8.0';
RqliteDialect.prototype.Query = Query;
RqliteDialect.prototype.DataTypes = DataTypes;
RqliteDialect.prototype.name = 'rqlite';
RqliteDialect.prototype.TICK_CHAR = '`';
RqliteDialect.prototype.TICK_CHAR_LEFT = RqliteDialect.prototype.TICK_CHAR;
RqliteDialect.prototype.TICK_CHAR_RIGHT = RqliteDialect.prototype.TICK_CHAR;

module.exports = RqliteDialect;
module.exports.RqliteDialect = RqliteDialect;
module.exports.default = RqliteDialect;
