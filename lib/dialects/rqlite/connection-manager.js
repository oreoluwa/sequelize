'use strict';

const AbstractConnectionManager = require('../abstract/connection-manager');
const Promise = require('../../promise');
const { logger } = require('../../utils/logger');
const debug = logger.debugContext('connection:rqlite');
const dataTypes = require('../../data-types').rqlite;
const sequelizeErrors = require('../../errors');
const parserStore = require('../parserStore')('rqlite');
const { URL } = require('url');

class ConnectionManager extends AbstractConnectionManager {
  constructor(dialect, sequelize) {
    super(dialect, sequelize);

    this.connections = {};
    this.lib = this._loadDialectModule('rqlite-js');
    this.refreshTypeParser(dataTypes);
  }

  // Expose this as a method so that the parsing may be updated when the user has added additional, custom types
  _refreshTypeParser(dataType) {
    parserStore.refresh(dataType);
  }

  _clearTypeParser() {
    parserStore.clear();
  }

  getConnection(options) {
    options = options || {};
    options.uuid = options.uuid || 'default';

    const dialectOptions = this.sequelize.options.dialectOptions;
    options.activeHostRoundRobin = dialectOptions && dialectOptions.roundRobin;

    if (this.connections[options.uuid]) {
      return Promise.resolve(this.connections[options.uuid]);
    }

    return new Promise((resolve, reject) => {
      const url = new URL('http://' + this.sequelize.options.host);
      url.port = this.sequelize.options.port;
      url.protocol = this.sequelize.options.protocol;
      this.connections[options.uuid] = new this.lib.DataApiClient(
        url.href,
        options,
      );
      debug(`connection acquired ${options.uuid}`);
      resolve(this.connections[options.uuid]);
    }).tap(connection => {
      if (this.sequelize.config.password) {
        // Make it possible to define and use password for sqlite encryption plugin like sqlcipher
        connection.execute(`PRAGMA KEY=${this.sequelize.escape(this.sequelize.config.password)}`);
      }
      if (this.sequelize.options.foreignKeys !== false) {
        // Make it possible to define and use foreign key constraints unless
        // explicitly disallowed. It's still opt-in per relation
        connection.execute('PRAGMA FOREIGN_KEYS=ON');
      }
    });
  }

  releaseConnection(connection, force) {
    if (connection.uuid) {
      debug(`connection released ${connection.uuid}`);
      delete this.connections[connection.uuid];
    }
  }
}

module.exports = ConnectionManager;
module.exports.ConnectionManager = ConnectionManager;
module.exports.default = ConnectionManager;
