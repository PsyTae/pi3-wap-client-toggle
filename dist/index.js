"use strict";

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _ip = require("ip");

var _ip2 = _interopRequireDefault(_ip);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _util = require("util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Object to initialize our available network interfaces with
 * @typedef {Object} netConfig
 * @property {boolean} [actingAsHotSpot=true] - Whether to start WLAN0 as a hotspot or not.
 * @property {static[]} [static=[]] - array of network devices that need to have a static ip address reserved for them, defaults to empty array
 * @property {...interface} [interface] - eth0, wlan0, wlan1, will contain client/server object, or both for the interface in question
 */

/**
 * @typedef {Object} static
 * @property {string} mac - mac address of network device needing a reserved IP address
 * @property {string} ipAddress - ip address to be reserved for network device
 * @property {string} name - name to give to device in dns
 */

/**
 * eth0, wlan0, wlan1: will contain client/server object, or both for the interface in question
 * @typedef {Object} interface
 * @property {client[]} client - Object with Client Properties for the Interface
 * @property {server} server - Object with Server Properties for the Interface
 */

/**
 * @typedef {Object} client
 * @property {string} name - Nickname to give the wireless Access Point Connection
 * @property {string} pass - Passphase to use to connect to a Wireless Access Point
 * @property {string} ssid - SSID to use to connect to a Wireless Access Point
 */

/**
 * @typedef {Object} server
 */

// npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }], no-else-return: 0, no-nested-ternary: 0, no-extend-native: 0 */

var execFilePromise = (0, _util.promisify)(_child_process2.default.execFile);

function NetSet() {
  var obj = {};

  var getIfaceMacAddress = function getIfaceMacAddress(iface) {
    return _child_process2.default.execFileSync("cat", ["/sys/class/net/" + iface + "/address"]).toString().trim();
  };

  var getIfaceSubNet = function getIfaceSubNet(ipAddress, subnet) {
    return _ip2.default.subnet(ipAddress, subnet);
  };

  var stopServices = function stopServices() {
    return new Promise(function (stopResolve, stopReject) {
      execFilePromise("systemctl", ["stop", "hostapd"]).then(execFilePromise("systemctl", ["stop", "dnsmasq"])).then(function () {
        return stopResolve();
      }).catch(function (error) {
        return stopReject(error);
      });
    });
  };

  var startServices = function startServices() {
    return new Promise(function (startResolve, startReject) {
      execFilePromise("systemctl", ["start", "dnsmasq"]).then(execFilePromise("systemctl", ["start", "hostapd"])).then(function () {
        return startResolve();
      }).catch(function (error) {
        return startReject(error);
      });
    });
  };

  var setStates = function setStates(states) {
    console.log(states);
    console.dir(obj, { depth: null });
    // obj.actingAsHotSpot = !state;
    // if (state) {
    // if obj.actingAsHotSpot === false needs to be flipped to true by end of if to signify acting as hotspot
    // todo: check files to see if services need to be stopped and files need to be reconfigured
    // todo: backup files if originals are not already saved
    // todo: stop services
    // todo: setup files for hostapd, and dnsmasq
    // todo: start services
    // todo: set obj.actingAsHotSpot = true
    // } else {
    // if obj.actingAsHotSpot === true needs to be flipped to false by end of if to signify actingg as client
    // todo: check files to see if services need to be stopped and files need to be reconfigured
    // todo: backup files if originals are not already saved
    // todo: stop services
    // todo: setup files to connect to wifi
    // todo: start services
    // todo: set obj.actingAsHotSpot = false
    // }
  };

  /**
   * Initialize Network
   * @param {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @param {netConfig} netConfig - Object used to store all connection info for network setup
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

    setStates(states);
  };

  var publicAPI = {
    getCurrentState: obj,
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