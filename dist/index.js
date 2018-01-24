"use strict";

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _ip = require("ip");

var _ip2 = _interopRequireDefault(_ip);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @typedef {Object} clientConfig
 * @property {string} ssid - SSID to look for and connect to
 * @property {string} pass - password for WIFI Connection
 */

/**
 * @typedef {Object} apConfig
 * @property {string} [address="192.168.254.0"] - Network IP Address for Access Point to use
 * @property {string} [subnetMask="255.255.255.0"] - Subnet Mask for Access Point to use
 * @property {number} [dhcpPoolSize=25] - Number of DHCP Clients that the Access Point will handle
 * @property {string} [dhcpLease="12h"] - string representing how long the lease will be 123 = 123 seconds, 45m = 45 minutes, 12h = 12 hours, infinite = no expiration(not recomended)
 * @property {string} [wapSSID="[HOSTNAME]"] - SSID to allow clients to connect to
 * @property {string} [wapPASS="Pa$$w0rd"] - password to use to connect to SSID
 * @property {boolean} [wapBroadcast=true] - Channel WAP will radiate on
 * @property {number} [wapChannel=6] - Channel WAP will radiate on
 */

function Iface() {
  var obj = {};

  var getIfaceMacAddress = function getIfaceMacAddress() {
    return _child_process2.default.execFileSync("cat", ["/sys/class/net/" + obj.iface + "/address"]).toString().trim();
  };

  var getIfaceSubNet = function getIfaceSubNet() {
    return _ip2.default.subnet(obj.apConfig.address, obj.apConfig.subnetMask);
  };

  var stopServices = function stopServices(callback) {
    return new Promise(function (resolve, reject) {
      _child_process2.default.execFile("systemctl", ["stop", "dnsmasq"], function (dnsError, dnsStdout, dnsStderr) {
        if (dnsError || dnsStderr) {
          if (!dnsError && dnsStderr) {
            dnsError = new Error(dnsStderr);
          }
          return callback ? callback(dnsError) : reject(dnsError);
        }
        _child_process2.default.execFile("systemctl", ["stop", "hostapd"], function (hostError, hostStdout, hostStdErr) {
          if (hostError || hostStdErr) {
            if (!hostError && hostStdErr) {
              hostError = new Error(hostStdErr);
            }
            return callback ? callback(hostError) : reject(hostError);
          }
          return callback ? callback(null, true) : resolve();
        });
      });
    });
  };

  var startServices = function startServices(callback) {
    return new Promise(function (resolve, reject) {
      _child_process2.default.execFile("systemctl", ["start", "dnsmasq"], function (dnsError, dnsStdout, dnsStderr) {
        if (dnsError || dnsStderr) {
          if (!dnsError && dnsStderr) {
            dnsError = new Error(dnsStderr);
          }
          return callback ? callback(dnsError) : reject(dnsError);
        }
        _child_process2.default.execFile("systemctl", ["start", "hostapd"], function (hostError, hostStdout, hostStdErr) {
          if (hostError || hostStdErr) {
            if (!hostError && hostStdErr) {
              hostError = new Error(hostStdErr);
            }
            return callback ? callback(hostError) : reject(hostError);
          }
          return callback ? callback(null, true) : resolve();
        });
      });
    });
  };

  var toggleAP = function toggleAP(state) {
    // obj.actingAsHotSpot = !state;
    if (!obj.actingAsHotSpot) {
      // if obj.actingAsHotSpot === false needs to be flipped to true by end of if to signify acting as hotspot
      // todo: check files to see if services need to be stopped and files need to be reconfigured
      // todo: backup files if originals are not already saved
      // todo: stop services
      // todo: setup files for hostapd, and dnsmasq
      // todo: start services
      // todo: set obj.actingAsHotSpot = true
    } else {
        // if obj.actingAsHotSpot === true needs to be flipped to false by end of if to signify actingg as client
        // todo: check files to see if services need to be stopped and files need to be reconfigured
        // todo: backup files if originals are not already saved
        // todo: stop services
        // todo: setup files to connect to wifi
        // todo: start services
        // todo: set obj.actingAsHotSpot = false
      }
  };

  /**
   * Initialize Interface
   * @param {string} [iface="wlan1"] - interface name such as wlan0
   * @param {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @param {clientConfig} clientConfig - Object used to Connect to Outside Network
   * @param {apConfig} apConfig - Object used to Establish a Wireless Access Point
   */
  var initIface = function initIface(iface, startAsHotspot, clientConfig, apConfig) {
    obj.iface = iface ? iface.toLowerCase() : "wlan0";
    obj.actingAsHotSpot = startAsHotspot ? !!startAsHotspot : true;
    obj.clientConfig = {};
    obj.apConfig = {};
    obj.apConfig.address = apConfig.address ? apConfig.address : "192.168.254.0";
    obj.apConfig.subnetMask = apConfig.subnetMask ? apConfig.subnetMask : "255.255.255.0";
    obj.apConfig.subnet = getIfaceSubNet(obj.apConfig.address, obj.apConfig.subnetMask);
    obj.apConfig.mac = getIfaceMacAddress(obj.iface);
    obj.apConfig.dhcpPoolSize = apConfig.dhcpPoolSize ? apConfig.dhcpPoolSize : 10;
    obj.apConfig.dhcpLease = apConfig.dhcpLease ? apConfig.dhcpLease : "12h";
    obj.apConfig.dhcpFirst = obj.apConfig.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 10)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 10) : _ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 2);
    obj.apConfig.dhcpLast = obj.apConfig.subnet.contains(_ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 10 + obj.apConfig.dhcpPoolSize)) ? _ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 10 + obj.apConfig.dhcpPoolSize) : _ip2.default.fromLong(_ip2.default.toLong(obj.apConfig.subnet.networkAddress) + 2 + obj.apConfig.dhcpPoolSize);
    obj.apConfig.wapChannel = apConfig.wapChannel ? apConfig.wapChannel : 6;
    obj.apConfig.wapBroadcast = apConfig.wapBroadcast ? apConfig.wapBroadcast : true;
    obj.apConfig.wapSSID = apConfig.wapSSID ? apConfig.wapSSID : _os2.default.hostname().toUpperCase();
    obj.apConfig.wapPASS = apConfig.wapPASS ? apConfig.wapPASS : "Pa$$w0rd";

    obj.clientConfig.ssid = clientConfig.ssid ? clientConfig.ssid : null;
    obj.clientConfig.pass = clientConfig.pass ? clientConfig.pass : null;

    // ! if obj.actingAsHotSpot === true then sends false to turn on hostspot
    // ! if obj.actingAsHotSpot === false then sends true to turn on client
    toggleAP(!obj.actingAsHotSpot);
  };

  var publicAPI = {
    getCurrentState: obj,
    initIface: initIface,
    toggleAP: toggleAP
  };

  return publicAPI;
} // npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }] */

module.exports = Iface;