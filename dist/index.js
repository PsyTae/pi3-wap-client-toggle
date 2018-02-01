"use strict";

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _ip = require("ip");

var _ip2 = _interopRequireDefault(_ip);

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _util = require("util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } // npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }], no-else-return: 0 */

var Network = function Network() {
  var obj = {};

  var execFilePromise = (0, _util.promisify)(_child_process2.default.execFile);

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

  var toggleAP = function toggleAP(state) {
    // obj.actingAsHotSpot = !state;

    // tested stop and start services above.
    if (state) {
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

  var initNetwork = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(startAsHotspot, setupObj) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              obj = setupObj;

              obj.actingAsHotSpot = startAsHotspot ? !!startAsHotspot : true;

              obj.eth0 = obj.eth0 || {};
              obj.static = obj.static || [];
              obj.wlan0 = obj.wlan0 || {};

              obj.eth0.server = obj.eth0.server || {};
              obj.wlan0.client = obj.wlan0.client || {};
              obj.wlan0.server = obj.wlan0.server || {};

              obj.eth0.mac = null;

              obj.eth0.server.address = setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.address ? setupObj.eth0.server.address : "10.0.0.1";
              obj.eth0.server.dhcpFirst = null;
              obj.eth0.server.dhcpLast = null;
              obj.eth0.server.dhcpLease = setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.dhcpLease ? setupObj.eth0.server.dhcpLease : "12h";
              obj.eth0.server.dhcpPoolSize = setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.dhcpPoolSize ? setupObj.eth0.server.dhcpPoolSize : 10;
              obj.eth0.server.subnet = null;
              obj.eth0.server.subnetMask = setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.subnetMask ? setupObj.eth0.server.subnetMask : "255.255.255.0";

              obj.wlan0.client.pass = setupObj && setupObj.wlan0 && setupObj.wlan0.client && setupObj.wlan0.client.pass ? setupObj.wlan0.client.pass : "VL" + _os2.default.hostname().toUpperCase();
              obj.wlan0.client.ssid = setupObj && setupObj.wlan0 && setupObj.wlan0.client && setupObj.wlan0.client.ssid ? setupObj.wlan0.client.ssid : "Pa$$w0rd";

              obj.wlan0.mac = null;

              obj.wlan0.server.address = setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.address ? setupObj.wlan0.server.address : "10.10.10.1";
              obj.wlan0.server.dhcpFirst = null;
              obj.wlan0.server.dhcpLast = null;
              obj.wlan0.server.dhcpLease = setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.dhcpLease ? setupObj.wlan0.server.dhcpLease : "12h";
              obj.wlan0.server.dhcpPoolSize = setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.dhcpPoolSize ? setupObj.wlan0.server.dhcpPoolSize : 10;
              obj.wlan0.server.subnet = null;
              obj.wlan0.server.subnetMask = setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.subnetMask ? setupObj.wlan0.server.subnetMask : "255.255.255.0";

              // const objKeys = Object.keys(obj);

              // objKeys.splice(objKeys.indexOf("actingAsHotSpot"), 1);
              // objKeys.splice(objKeys.indexOf("static"), 1);

              // objKeys.forEach(elem => {
              //   if (!obj[elem].mac) obj[elem].mac = getIfaceMacAddress(elem);
              //   if (!obj[elem].server.subnet) {
              //     obj[elem].server.subnet = getIfaceSubNet(obj[elem].server.address, obj[elem].server.subnetMask);
              //   }
              //   obj[elem].server.dhcpFirst = obj[elem].server.subnet.contains(ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10))
              //     ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10)
              //     : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2);
              //   obj[elem].server.dhcpLast = obj[elem].server.subnet.contains(
              //     ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
              //   )
              //     ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
              //     : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2 + obj[elem].server.dhcpPoolSize);
              // });

            case 26:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function initNetwork(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();

  var publicAPI = {
    getCurrentState: obj,
    initNetwork: initNetwork,
    toggleAP: toggleAP
  };

  return publicAPI;
};

module.exports = Network;