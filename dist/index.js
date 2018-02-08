"use strict";

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _ip = require("ip");

var _ip2 = _interopRequireDefault(_ip);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _util = require("util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }], no-else-return: 0, no-nested-ternary: 0, no-extend-native: 0 */

/**
 * Object to initialize our available network interfaces with
 * @typedef {Object} obj
 * @property {boolean} [actingAsHotSpot=true] - Whether to start WLAN0 as a hotspot or not.
 * @property {static} [static=[]] - array of network devices that need to have a static ip address reserved for them, defaults to empty array
 * @property {...interface} [interface] - eth0, wlan0, wlan1, will contain client/server object, or both for the interface in question
 */

/**
 * Object passed in from calling program to initialize our network setup.
 * @typedef {Object} netConfig
 * @property {static} [static=[]] - array of network devices that need to have a static ip address reserved for them, defaults to empty array
 * @property {...interface} [interface] - eth0, wlan0, wlan1, will contain client/server object, or both for the interface in question
 */

/**
 * Array of Network Devices that need to have a fixed IP address, defautls to an empty array
 * @typedef {Object[]} static
 * @property {string} mac - mac address of network device needing a reserved IP address
 * @property {string} ipAddress - ip address to be reserved for network device
 * @property {string} name - name to give to device in dns
 */

/**
 * List of APs to listen for and connect to when in WiFi mode.
 * @typedef {Object[]} clients
 * @property {string} name - Nickname to give the wireless Access Point Connection
 * @property {string} pass - Passphase to use to connect to a Wireless Access Point
 * @property {string} ssid - SSID to use to connect to a Wireless Access Point
 */

/**
 * calculated by ip, needs an ip address, and subnetMask
 * @typedef {Object} subnet
 * @property {string} subnet.networkAddress - network address for the subnet
 * @property {string} subnet.firstAddress - first useable ip address of the subnet
 * @property {string} subnet.lastAddress - last usable ip address of the subnet
 * @property {string} subnet.broadcastAddress - broadcast address for the subnet
 * @property {string} subnet.subnetMask - subnetmask for the subnet
 * @property {string} subnet.subnetMaskLength - cidr length for the subnet
 * @property {string} subnet.numHosts - how many hosts found in th subnet
 * @property {string} subnet.length - how many address are in the subnet, indluding network and broadcast
 * @property {function} subnet.contains - function to see if an Ip Address given falls inside the specified subnet
 */

/**
 * @typedef {Object} server
 * @property {string} address - Static IP Address to give interface when in DHCP Server Mode
 * @property {string} [subnetMask="255.255.255.0"] - Subnet mask to use when in DHCP Server Mode
 * @property {string} [dhcpLease="12h"] - How long the dhcp lease should be good for 1h = 1 hour, 1m = 1 minute, 30 = 30 seconds | defaults to 12h
 * @property {number} [dhcpPoolSize=10] - Size of the DHCP Pool to lease from
 * @property {subnet} subnet - Calculated based on address and subnetMask
 * @property {string} dhcpFirst - Calculated based on Subnet size and dhcpPoolSize
 * @property {string} dhcpLast - Calculated based on Subnet size and dhcpPoolSize
 */

/**
 * eth0, wlan0, wlan1: will contain client/server object, or both for the interface in question
 * @typedef {Object} interface
 * @property {clients=} clients - Object with Client Properties for the Interface
 * @property {server=} server - Object with Server Properties for the Interface
 */

var files = ["/etc/default/hostapd", "/etc/dhcpcd.conf", "/etc/dnsmasq.conf", "/etc/hostapd/hostapd.conf", "/etc/network/interfaces", "/etc/wpa_supplicant/wpa_supplicant.conf"];

function NetSet() {
  var _this = this;

  var obj = {};

  var getIfaceMacAddress = function getIfaceMacAddress(iface) {
    return _child_process2.default.execFileSync("cat", ["/sys/class/net/" + iface + "/address"]).toString().trim();
  };

  var getIfaceSubNet = function getIfaceSubNet(ipAddress, subnet) {
    return _ip2.default.subnet(ipAddress, subnet);
  };

  var stopServices = function stopServices(callback) {
    return new Promise(function (resolve, reject) {
      var cbObj = {};
      _child_process2.default.execFile("systemctl", ["stop", "hostapd"], function (hostErr, hostStdOut, hostStdErr) {
        if (hostErr) return callback ? callback(hostErr) : reject(hostErr);
        cbObj.hostapd = {
          StdOut: hostStdOut,
          StdErr: hostStdErr
        };
        _child_process2.default.execFile("systemctl", ["stop", "dnsmasq"], function (dnsErr, dnsStdOut, dnsStdErr) {
          if (dnsErr) return callback ? callback(dnsErr) : reject(dnsErr);
          cbObj.dnsmasq = {
            StdOut: dnsStdOut,
            StdErr: dnsStdErr
          };
          return callback ? callback(null, cbObj) : resolve(cbObj);
        });
      });
    });
  };

  var startServices = function startServices(callback) {
    return new Promise(function (resolve, reject) {
      var cbObj = {};
      _child_process2.default.execFile("systemctl", ["start", "hostapd"], function (hostErr, hostStdOut, hostStdErr) {
        if (hostErr) return callback ? callback(hostErr) : reject(hostErr);
        cbObj.hostapd = {
          StdOut: hostStdOut,
          StdErr: hostStdErr
        };
        _child_process2.default.execFile("systemctl", ["start", "dnsmasq"], function (dnsErr, dnsStdOut, dnsStdErr) {
          if (dnsErr) return callback ? callback(dnsErr) : reject(dnsErr);
          cbObj.dnsmasq = {
            StdOut: dnsStdOut,
            StdErr: dnsStdErr
          };
          return callback ? callback(null, cbObj) : resolve(cbObj);
        });
      });
    });
  };

  var setStates = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(states) {
      var createEmptyBackupFile, makeBackup, createFileContent, FilesToBeModified, ensureBackups;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              // console.log(states);
              console.dir(obj, { depth: null });

              createEmptyBackupFile = function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file) {
                  var writeFile;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          writeFile = (0, _util.promisify)(_fs2.default.writeFile);
                          // if error writing to file for any reason it will throw an error

                          _context.next = 3;
                          return writeFile(file + ".bak", Buffer.alloc(0));

                        case 3:
                          return _context.abrupt("return", true);

                        case 4:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, _this);
                }));

                return function createEmptyBackupFile(_x2) {
                  return _ref2.apply(this, arguments);
                };
              }();

              makeBackup = function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(file) {
                  var copyFile;
                  return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          if (!_fs2.default.existsSync(file + ".bak")) {
                            _context2.next = 2;
                            break;
                          }

                          return _context2.abrupt("return", true);

                        case 2:
                          _context2.prev = 2;
                          copyFile = (0, _util.promisify)(_fs2.default.copyFile);
                          // if backup file doens't exist copy file to file.bak

                          _context2.next = 6;
                          return copyFile(file, file + ".bak");

                        case 6:
                          return _context2.abrupt("return", true);

                        case 9:
                          _context2.prev = 9;
                          _context2.t0 = _context2["catch"](2);

                          if (!(_context2.t0.code === "ENOENT")) {
                            _context2.next = 13;
                            break;
                          }

                          return _context2.abrupt("return", createEmptyBackupFile(file));

                        case 13:
                          return _context2.abrupt("return", _context2.t0);

                        case 14:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, _this, [[2, 9]]);
                }));

                return function makeBackup(_x3) {
                  return _ref3.apply(this, arguments);
                };
              }();

              createFileContent = function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(state) {
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          console.log(state);
                          return _context3.abrupt("return", state);

                        case 2:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this);
                }));

                return function createFileContent(_x4) {
                  return _ref4.apply(this, arguments);
                };
              }();

              _context4.prev = 4;
              _context4.next = 7;
              return Promise.all(states.map(createFileContent));

            case 7:
              FilesToBeModified = _context4.sent;

              console.log(FilesToBeModified);

              // ensure that there is a backup of all files that could be modified
              _context4.next = 11;
              return Promise.all(files.map(makeBackup));

            case 11:
              ensureBackups = _context4.sent;

              console.log(ensureBackups);

              return _context4.abrupt("return", Object.assign({}, obj));

            case 16:
              _context4.prev = 16;
              _context4.t0 = _context4["catch"](4);
              return _context4.abrupt("return", _context4.t0);

            case 19:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, _this, [[4, 16]]);
    }));

    return function setStates(_x) {
      return _ref.apply(this, arguments);
    };
  }();

  // if obj.actingAsHotSpot === false needs to be flipped to true by end of if to signify acting as hotspot
  // todo: check files to see if services need to be stopped and files need to be reconfigured
  // todo: backup files if originals are not already saved
  // todo: stop services
  // todo: setup files for hostapd, and dnsmasq
  // todo: start services
  // todo: set obj.actingAsHotSpot = true

  // if obj.actingAsHotSpot === true needs to be flipped to false by end of if to signify actingg as client
  // todo: check files to see if services need to be stopped and files need to be reconfigured
  // todo: backup files if originals are not already saved
  // todo: stop services
  // todo: setup files to connect to wifi
  // todo: start services
  // todo: set obj.actingAsHotSpot = false

  /**
   * Initialize Network
   * @type {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @type {netConfig} netConfig - Object used to store all connection info for network setup
   */
  var initNetwork = function initNetwork(startAsHotspot, netConfig) {
    var states = {};
    var objKeys = Object.keys(obj);
    var configKeys = netConfig ? Object.keys(netConfig) : [];
    obj.actingAsHotSpot = !!startAsHotspot;

    // hanldes anything other than eth0 and wlan0
    configKeys.diff(objKeys).forEach(function (elem) {
      obj[elem] = elem === "static" ? netConfig[elem] : {};
      if (elem !== "static") obj[elem].mac = netConfig[elem].mac ? netConfig[elem].mac : getIfaceMacAddress(elem);

      if (netConfig[elem].server) {
        states[elem] = "server";
        obj[elem].server = {};
        obj[elem].server.address = netConfig[elem].server.address ? netConfig[elem].server.address : "10.255.255.255";
        obj[elem].server.dhcpLease = netConfig[elem].server.dhcpLease ? netConfig[elem].server.dhcpLease : "12h";
        obj[elem].server.dhcpPoolSize = netConfig[elem].server.dhcpPoolSize ? netConfig[elem].server.dhcpPoolSize : 10;
        obj[elem].server.subnetMask = netConfig[elem].server.subnetMask ? netConfig[elem].server.subnetMask : "255.255.255.0";
        obj[elem].server.subnet = netConfig[elem].server.subnet ? netConfig[elem].server.subnet : getIfaceSubNet(obj[elem].server.address, obj[elem].server.subnetMask);
        obj[elem].server.dhcpFirst = netConfig[elem].server.dhcpFirst ? netConfig[elem].server.dhcpFirst : obj[elem].server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 10)) ? _ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 10) : _ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 2);
        obj[elem].server.dhcpLast = netConfig[elem].server.dhcpLast ? netConfig[elem].server.dhcpLast : obj[elem].server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)) ? _ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize) : _ip2.default.fromLong(_ip2.default.toLong(obj[elem].server.subnet.networkAddress) + 2 + obj[elem].server.dhcpPoolSize);
      }
      if (netConfig[elem].clients) {
        states[elem] = "clients";
        obj[elem].clients = [];
        netConfig[elem].clients.forEach(function (connection) {
          if (connection.name && connection.pass && connection.ssid) obj[elem].clients.push(connection);
        });
      }
      if (netConfig[elem].server && netConfig[elem].clients) states[elem] = "clients";
    });

    states.eth0 = "server";
    states.wlan0 = obj.actingAsHotSpot ? "server" : "clients";

    if (!obj.eth0) obj.eth0 = netConfig && netConfig.eth0 ? netConfig.eth0 : {};
    if (!obj.static) obj.static = netConfig && netConfig.static ? netConfig.static : [];
    if (!obj.wlan0) obj.wlan0 = netConfig && netConfig.wlan0 ? netConfig.wlan0 : {};

    if (!obj.eth0.server) obj.eth0.server = netConfig && netConfig.eth0 && netConfig.eth0.server ? netConfig.eth0.server : {};
    if (!obj.wlan0.clients) obj.wlan0.clients = netConfig && netConfig.wlan0 && netConfig.wlan0.clients && obj.wlan0.clients.length === 0 ? netConfig.wlan0.clients : [];
    if (!obj.wlan0.server) obj.wlan0.server = netConfig && netConfig.wlan0 && netConfig.wlan0.server ? netConfig.wlan0.server : {};

    if (!obj.eth0.mac) obj.eth0.mac = netConfig && netConfig.eth0 && netConfig.eth0.mac ? netConfig.eth0.mac : getIfaceMacAddress("eth0");
    if (!obj.wlan0.mac) obj.wlan0.mac = netConfig && netConfig.wlan0 && netConfig.wlan0.mac ? netConfig.wlan0.mac : getIfaceMacAddress("wlan0");

    if (!obj.eth0.server.address) obj.eth0.server.address = netConfig && netConfig.eth0 && netConfig.eth0.server.address ? netConfig.eth0.server.address : "10.0.0.1";
    if (!obj.eth0.server.dhcpLease) obj.eth0.server.dhcpLease = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLease ? netConfig.eth0.server.dhcpLease : "12h";
    if (!obj.eth0.server.dhcpPoolSize) obj.eth0.server.dhcpPoolSize = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpPoolSize ? netConfig.eth0.server.dhcpPoolSize : 10;
    if (!obj.eth0.server.subnetMask) obj.eth0.server.subnetMask = netConfig && netConfig.eth0 && netConfig.eth0.server.subnetMask ? netConfig.eth0.server.subnetMask : "255.255.255.0";
    if (!obj.eth0.server.subnet) obj.eth0.server.subnet = netConfig && netConfig.eth0 && netConfig.eth0.server.subnet ? netConfig.eth0.server.subnet : getIfaceSubNet(obj.eth0.server.address, obj.eth0.server.subnetMask);
    if (!obj.eth0.server.dhcpFirst) obj.eth0.server.dhcpFirst = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpFirst ? netConfig.eth0.server.dhcpFirst : obj.eth0.server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 10)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 10) : _ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 2);
    if (!obj.eth0.server.dhcpLast) obj.eth0.server.dhcpLast = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLast ? netConfig.eth0.server.dhcpLast : obj.eth0.server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 10 + obj.eth0.server.dhcpPoolSize)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 10 + obj.eth0.server.dhcpPoolSize) : _ip2.default.fromLong(_ip2.default.toLong(obj.eth0.server.subnet.networkAddress) + 2 + obj.eth0.server.dhcpPoolSize);

    if (!obj.wlan0.server.apInfo) obj.wlan0.server.apInfo = {};
    if (!obj.wlan0.server.apInfo.pass) obj.wlan0.server.apInfo.pass = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.pass ? netConfig.wlan0.server.apInfo.pass : "Pa$$w0rd";
    if (!obj.wlan0.server.apInfo.ssid) obj.wlan0.server.apInfo.ssid = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.ssid ? netConfig.wlan0.server.apInfo.ssid : "VL" + _os2.default.hostname().toUpperCase();

    if (!obj.wlan0.server.address) obj.wlan0.server.address = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.address ? netConfig.wlan0.server.address : "10.10.10.1";
    if (!obj.wlan0.server.dhcpLease) obj.wlan0.server.dhcpLease = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpLease ? netConfig.wlan0.server.dhcpLease : "12h";
    if (!obj.wlan0.server.dhcpPoolSize) obj.wlan0.server.dhcpPoolSize = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpPoolSize ? netConfig.wlan0.server.dhcpPoolSize : 10;
    if (!obj.wlan0.server.subnetMask) obj.wlan0.server.subnetMask = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.subnetMask ? netConfig.wlan0.server.subnetMask : "255.255.255.0";

    if (!obj.wlan0.server.subnet) obj.wlan0.server.subnet = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.subnet ? netConfig.wlan0.server.subnet : getIfaceSubNet(obj.wlan0.server.address, obj.wlan0.server.subnetMask);

    if (!obj.wlan0.server.dhcpFirst) obj.wlan0.server.dhcpFirst = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpFirst ? netConfig.wlan0.server.dhcpFirst : obj.wlan0.server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 10)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 10) : _ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 2);

    if (!obj.wlan0.server.dhcpLast) obj.wlan0.server.dhcpLast = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpLast ? netConfig.wlan0.server.dhcpLast : obj.wlan0.server.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 10 + obj.wlan0.server.dhcpPoolSize)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 10 + obj.wlan0.server.dhcpPoolSize) : _ip2.default.fromLong(_ip2.default.toLong(obj.wlan0.server.subnet.networkAddress) + 2 + obj.wlan0.server.dhcpPoolSize);

    var setupWifi = setStates(states);
    setupWifi.then().catch();
  };

  var getCurrentState = function getCurrentState() {
    return Object.assign({}, obj);
  };

  var publicAPI = {
    getCurrentState: getCurrentState,
    initNetwork: initNetwork,
    setStates: setStates
  };

  return publicAPI;
}

Array.prototype.diff = function (a) {
  return this.filter(function (i) {
    return a.indexOf(i) < 0;
  });
};

module.exports = NetSet;