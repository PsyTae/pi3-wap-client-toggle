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

Array.prototype.diff = function (a) {
  return this.filter(function (i) {
    return a.indexOf(i) < 0;
  });
};

Array.prototype.inArray = function (comparer) {
  for (var i = 0; i < this.length; i += 1) {
    if (comparer(this[i])) return true;
  }
  return false;
};

Array.prototype.pushIfNotExist = function (element, comparer) {
  if (!this.inArray(comparer)) this.push(element);
};
/*
// a demo of how to use pushIfNotExist
const array = [{ name: "tom", text: "tasty" }];
const element = { name: "tom", text: "tasty" };
array.pushIfNotExist(element, (e) => e.name === element.name && e.text === element.text);
 */

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
 * @property {string} networkAddress - network address for the subnet
 * @property {string} firstAddress - first useable ip address of the subnet
 * @property {string} lastAddress - last usable ip address of the subnet
 * @property {string} broadcastAddress - broadcast address for the subnet
 * @property {string} subnetMask - subnetmask for the subnet
 * @property {string} subnetMaskLength - cidr length for the subnet
 * @property {string} numHosts - how many hosts found in th subnet
 * @property {string} length - how many address are in the subnet, indluding network and broadcast
 * @property {function} contains - function to see if an Ip Address given falls inside the specified subnet
 */

/**
 * @typedef {Object} apInfo
 * @property {boolean} bradcast - Whether to broadcast the SSID or not
 * @property {number} channel - channel to broadcast out on
 * @property {string} ssid - ssid to connect to for AP Mode
 * @property {string} pass - password to authenticate access for AP Mode
 */

/**
 * @typedef {Object} server
 * @property {apInfo} [apInfo] - Object Containing broadcast, channel, ssid, and password for AP Mode
 * @property {string} address - Static IP Address to give interface when in DHCP Server Mode
 * @property {string} [subnetMask="255.255.255.0"] - Subnet mask to use when in DHCP Server Mode
 * @property {string} [dhcpLease="12h"] - How long the dhcp lease should be good for 1h = 1 hour, 1m = 1 minute, 30 = 30 seconds | defaults to 12h
 * @property {number} [dhcpPoolSize=10] - Size of the DHCP Pool to lease from
 * @property {subnet} [subnet] - Calculated based on address and subnetMask
 * @property {string} [dhcpFirst] - Calculated based on Subnet size and dhcpPoolSize
 * @property {string} [dhcpLast] - Calculated based on Subnet size and dhcpPoolSize
 */

/**
 * eth0, wlan0, wlan1: will contain client/server object, or both for the interface in question
 * @typedef {Object} interface
 * @property {clients} clients - Object with Client Properties for the Interface
 * @property {server} server - Object with Server Properties for the Interface
 */

var filesToBackup = ["/etc/default/hostapd", "/etc/dhcpcd.conf", "/etc/dnsmasq.conf", "/etc/hostapd/hostapd.conf", "/etc/network/interfaces", "/etc/wpa_supplicant/wpa_supplicant.conf"];

var allFiles = ["/etc/default/hostapd", "/etc/dhcpcd.conf", "/etc/dnsmasq.conf", "/etc/dnsmasqconfs/eth0.dnsmasq.conf", "/etc/dnsmasqconfs/static.dnsmasq.conf", "/etc/dnsmasqconfs/wlan0.dnsmasq.conf", "/etc/hostapd/hostapd.conf", "/etc/network/interfaces", "/etc/wpa_supplicant/wpa_supplicant.conf"];

function NetSet() {
  var _this = this;

  var obj = {};

  var getIfaceMacAddress = function getIfaceMacAddress(iface) {
    return _child_process2.default.execFileSync("cat", ["/sys/class/net/" + iface + "/address"]).toString().trim();
  };

  var getIfaceSubNet = function getIfaceSubNet(ipAddress, subnet) {
    return _ip2.default.subnet(ipAddress, subnet);
  };

  var stopServices = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var execFile;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              execFile = (0, _util.promisify)(_child_process2.default.execFile);
              return _context.abrupt("return", Promise.all([execFile("systemctl", ["stop", "hostapd"]), execFile("systemctl", ["stop", "dnsmasq"]), execFile("systemctl", ["stop", "wpa_supplicant"])]));

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function stopServices() {
      return _ref.apply(this, arguments);
    };
  }();

  var startServices = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var execFile;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              execFile = (0, _util.promisify)(_child_process2.default.execFile);
              return _context2.abrupt("return", Promise.all([execFile("systemctl", ["start", "hostapd"]), execFile("systemctl", ["start", "dnsmasq"]), execFile("systemctl", ["start", "wpa_supplicant"])]));

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function startServices() {
      return _ref2.apply(this, arguments);
    };
  }();

  var setStates = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(states) {
      var createEmptyBackupFile, makeBackup, createFileContent, FilesToBeModifiedObj, FilesToBeModified, ensureBackups;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              // console.log(states);
              console.dir(obj, { depth: null });

              createEmptyBackupFile = function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(file) {
                  var writeFile;
                  return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          writeFile = (0, _util.promisify)(_fs2.default.writeFile);
                          // if error writing to file for any reason it will throw an error

                          _context3.next = 3;
                          return writeFile(file + ".bak", Buffer.alloc(0));

                        case 3:
                          return _context3.abrupt("return", true);

                        case 4:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, _this);
                }));

                return function createEmptyBackupFile(_x2) {
                  return _ref4.apply(this, arguments);
                };
              }();

              makeBackup = function () {
                var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(file) {
                  var copyFile;
                  return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          if (!_fs2.default.existsSync(file + ".bak")) {
                            _context4.next = 2;
                            break;
                          }

                          return _context4.abrupt("return", true);

                        case 2:
                          _context4.prev = 2;
                          copyFile = (0, _util.promisify)(_fs2.default.copyFile);
                          // if backup file doens't exist copy file to file.bak

                          _context4.next = 6;
                          return copyFile(file, file + ".bak");

                        case 6:
                          return _context4.abrupt("return", true);

                        case 9:
                          _context4.prev = 9;
                          _context4.t0 = _context4["catch"](2);

                          if (!(_context4.t0.code === "ENOENT")) {
                            _context4.next = 13;
                            break;
                          }

                          return _context4.abrupt("return", createEmptyBackupFile(file));

                        case 13:
                          return _context4.abrupt("return", _context4.t0);

                        case 14:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, _this, [[2, 9]]);
                }));

                return function makeBackup(_x3) {
                  return _ref5.apply(this, arguments);
                };
              }();

              createFileContent = function () {
                var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(stateObj) {
                  var fileObj, availableIfaces;
                  return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          fileObj = {};
                          availableIfaces = Object.keys(stateObj);


                          fileObj["/etc/dnsmasq.conf"] = ["bind-interfaces", "bogus-priv", "server=8.8.8.8", "server=8.8.4.4", "listen-address=127.0.0.1", "clear-on-reload", "conf-dir=/etc/dnsmasqconfs/", ""];
                          fileObj["/etc/dnsmasqconfs/static.dnsmasq.conf"] = [];
                          obj.static.forEach(function (device) {
                            fileObj["/etc/dnsmasqconfs/static.dnsmasq.conf"].push("dhcp-host=" + device.mac + "," + device.ipAddress + "," + device.name + ",infinite");
                          });

                          fileObj["/etc/dhcpcd.conf"] = ["hostname", "clientid", "persistent", "option rapid_commit", "option domain_name_servers, domain_name, domain_search, host_name", "option classless_static_routes", "option ntp_servers", "option interface_mtu", "require dhcp_server_identifier", "slaac private", ""];

                          fileObj["/etc/default/hostapd"] = ["DAEMON_CONF=\"\"", "DAEMON_OPTS=\"\"", ""];

                          fileObj["/etc/network/interfaces"] = ["source-directory /etc/network/interfaces.d", "", "auto lo", "iface lo inet loopback", ""];

                          availableIfaces.forEach(function (iface) {
                            switch (true) {
                              case stateObj[iface].toLowerCase() === "server":
                                allFiles.pushIfNotExist("/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf", function (e) {
                                  return e === "/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf";
                                });
                                fileObj["/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf"] = ["interface=" + iface, "listen-address=" + obj[iface].server.subnet.firstAddress, "dhcp-range=" + iface + "," + obj[iface].server.dhcpFirst + "," + obj[iface].server.dhcpLast + "," + obj[iface].server.subnetMask + "," + obj[iface].server.subnet.broadcastAddress + "," + obj[iface].server.dhcpLease, ""];

                                fileObj["/etc/network/interfaces"].push("" + (iface === "eth0" || iface === "wlan0" ? "auto " + iface : "allow-hotplug " + iface));
                                fileObj["/etc/network/interfaces"].push("iface " + iface + " inet static");
                                fileObj["/etc/network/interfaces"].push("    address " + obj[iface].server.subnet.firstAddress);
                                fileObj["/etc/network/interfaces"].push("    gateway " + obj[iface].server.subnet.firstAddress);
                                fileObj["/etc/network/interfaces"].push("    network " + obj[iface].server.subnet.networkAddress);
                                fileObj["/etc/network/interfaces"].push("    netmask " + obj[iface].server.subnet.subnetMask);
                                fileObj["/etc/network/interfaces"].push("    broadcast " + obj[iface].server.subnet.broadcastAddress);
                                fileObj["/etc/network/interfaces"].push("");

                                if (obj[iface].server.apInfo) {
                                  fileObj["/etc/dhcpcd.conf"].push("denyinterfaces " + iface);
                                  fileObj["/etc/dhcpcd.conf"].push("");

                                  fileObj["/etc/default/hostapd"] = ["DAEMON_CONF=\"/etc/hostapd/hostapd.conf\"", "DAEMON_OPTS=\"\"", ""];

                                  fileObj["/etc/hostapd/hostapd.conf"] = ["interface=" + iface, "driver=nl80211", "ssid=" + obj[iface].server.apInfo.ssid, "hw_mode=g", "channel=" + obj[iface].server.apInfo.channel, "ieee80211n=1", "wmm_enabled=0", "macaddr_acl=0", "auth_algs=1", "ignore_broadcast_ssid=" + (obj[iface].server.apInfo.bradcast ? 0 : 1), "wpa=2", "wpa_key_mgmt=WPA-PSK", "wpa_passphrase=" + obj[iface].server.apInfo.pass, "rsn_pairwise=CCMP", ""];
                                }
                                break;
                              case stateObj[iface].toLowerCase() === "client":
                              case stateObj[iface].toLowerCase() === "clients":
                                stateObj[iface] = "clients";
                                allFiles.pushIfNotExist("/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf", function (e) {
                                  return e === "/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf";
                                });
                                fileObj["/etc/dnsmasqconfs/" + iface + ".dnsmasq.conf"] = [];

                                fileObj["/etc/network/interfaces"].push("" + (iface === "eth0" || iface === "wlan0" ? "auto " + iface : "allow-hotplug " + iface));
                                fileObj["/etc/network/interfaces"].push("iface " + iface + " inet dhcp");
                                fileObj["/etc/network/interfaces"].push("");

                                if (iface === "wlan0") {
                                  fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"] = ["country=US", "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev", "update_config=1", ""];
                                  obj[iface].clients.forEach(function (client) {
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("network={");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("    scan_ssid=1");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("    ssid=\"" + client.ssid + "\"");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("    psk=\"" + client.pass + "\"");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("    id_str=\"" + client.name + "\"");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("}");
                                    fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"].push("");
                                  });
                                } else {
                                  fileObj["/etc/wpa_supplicant/wpa_supplicant.conf"] = ["country=US", "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev", "update_config=1", ""];
                                }
                                break;
                              default:
                                break;
                            }
                          });
                          return _context5.abrupt("return", fileObj);

                        case 10:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, _this);
                }));

                return function createFileContent(_x4) {
                  return _ref6.apply(this, arguments);
                };
              }();

              _context6.prev = 4;
              _context6.next = 7;
              return createFileContent(states);

            case 7:
              FilesToBeModifiedObj = _context6.sent;
              FilesToBeModified = Object.keys(FilesToBeModifiedObj).sort();

              console.log(FilesToBeModifiedObj);
              console.log(FilesToBeModified);

              // ensure that there is a backup of all files that could be modified
              _context6.next = 13;
              return Promise.all(filesToBackup.map(makeBackup));

            case 13:
              ensureBackups = _context6.sent;

              console.log(ensureBackups);

              return _context6.abrupt("return", Object.assign({}, obj));

            case 18:
              _context6.prev = 18;
              _context6.t0 = _context6["catch"](4);

              console.error("catch Error:", _context6.t0);
              return _context6.abrupt("return", _context6.t0);

            case 22:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, _this, [[4, 18]]);
    }));

    return function setStates(_x) {
      return _ref3.apply(this, arguments);
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
    if (!obj.wlan0.server.apInfo.bradcast) obj.wlan0.server.apInfo.bradcast = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.bradcast ? netConfig.wlan0.server.apInfo.bradcast : true;
    if (!obj.wlan0.server.apInfo.channel) obj.wlan0.server.apInfo.channel = netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.channel ? netConfig.wlan0.server.apInfo.channel : 6;
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

module.exports = NetSet;