// npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }], no-else-return: 0 */

import child from "child_process";
import ip from "ip";
import os from "os";
import { promisify } from "util";

/**
 * @typedef {Object} netConfig
 * @property {string} [address="192.168.254.0"] - Network IP Address for Access Point to use
 * @property {string} [subnetMask="255.255.255.0"] - Subnet Mask for Access Point to use
 * @property {number} [dhcpPoolSize=25] - Number of DHCP Clients that the Access Point will handle
 * @property {string} [dhcpLease="12h"] - string representing how long the lease will be 123 = 123 seconds, 45m = 45 minutes, 12h = 12 hours, infinite = no expiration(not recomended)
 * @property {string} [wapSSID="[HOSTNAME]"] - SSID to allow clients to connect to
 * @property {string} [wapPASS="Pa$$w0rd"] - password to use to connect to SSID
 * @property {boolean} [wapBroadcast=true] - Channel WAP will radiate on
 * @property {number} [wapChannel=6] - Channel WAP will radiate on
 */

const execFilePromise = promisify(child.execFile);

function NetSet() {
  const obj = {};

  const getIfaceMacAddress = iface =>
    child
      .execFileSync("cat", [`/sys/class/net/${iface}/address`])
      .toString()
      .trim();

  const getIfaceSubNet = (ipAddress, subnet) => ip.subnet(ipAddress, subnet);

  const stopServices = () =>
    new Promise((stopResolve, stopReject) => {
      execFilePromise("systemctl", ["stop", "hostapd"])
        .then(execFilePromise("systemctl", ["stop", "dnsmasq"]))
        .then(() => stopResolve())
        .catch(error => stopReject(error));
    });

  const startServices = () =>
    new Promise((startResolve, startReject) => {
      execFilePromise("systemctl", ["start", "dnsmasq"])
        .then(execFilePromise("systemctl", ["start", "hostapd"]))
        .then(() => startResolve())
        .catch(error => startReject(error));
    });

  const toggleAP = state => {
    // obj.actingAsHotSpot = !state;

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

  /**
   * Initialize Network
   * @param {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @param {netConfig} netConfig - Object used to store all connection info for network setup
   */
  const initNetwork = (startAsHotspot, netConfig) => {
    const objKeys = Object.keys(obj);
    const configKeys = netConfig ? Object.keys(netConfig) : [];
    obj.actingAsHotSpot = startAsHotspot ? !!startAsHotspot : true;

    configKeys.diff(objKeys).forEach(elem => {
      objKeys.push(elem);
      obj[elem] = elem === "static" ? netConfig[elem] : {};
      if (elem !== "static") obj[elem].mac = netConfig[elem].mac ? netConfig[elem].mac : getIfaceMacAddress(elem);
      if (netConfig[elem].server) {
        obj[elem].server = {};
        obj[elem].server.address = netConfig[elem].server.address ? netConfig[elem].server.address : "10.255.255.255";
        obj[elem].server.dhcpFirst = netConfig[elem].server.dhcpFirst ? netConfig[elem].server.dhcpFirst : null;
        obj[elem].server.dhcpLast = netConfig[elem].server.dhcpLast ? netConfig[elem].server.dhcpLast : null;
        obj[elem].server.dhcpLease = netConfig[elem].server.dhcpLease ? netConfig[elem].server.dhcpLease : "12h";
        obj[elem].server.dhcpPoolSize = netConfig[elem].server.dhcpPoolSize ? netConfig[elem].server.dhcpPoolSize : 10;
        obj[elem].server.subnet = netConfig[elem].server.subnet ? netConfig[elem].server.subnet : null;
        obj[elem].server.subnetMask = netConfig[elem].server.subnetMask ? netConfig[elem].server.subnetMask : "255.255.255.0";
      }
      if (netConfig[elem].client) {
        obj[elem].client = {};
        obj[elem].client.pass = netConfig[elem].client.pass ? netConfig[elem].client.pass : "Pa$$w0rd";
        obj[elem].client.ssid = netConfig[elem].client.ssid ? netConfig[elem].client.ssid : `VL${os.hostname().toUpperCase()}`;
      }
    });

    obj.eth0 = netConfig && netConfig.eth0 ? netConfig.eth0 : {};
    obj.static = netConfig && netConfig.static ? netConfig.static : [];
    obj.wlan0 = netConfig && netConfig.wlan0 ? netConfig.wlan0 : {};

    obj.eth0.server = netConfig && netConfig.eth0 && netConfig.eth0.server ? netConfig.eth0.server : {};
    obj.wlan0.client = netConfig && netConfig.wlan0 && netConfig.wlan0.client ? netConfig.wlan0.client : {};
    obj.wlan0.server = netConfig && netConfig.wlan0 && netConfig.wlan0.server ? netConfig.wlan0.server : {};

    obj.eth0.mac = netConfig && netConfig.eth0 && netConfig.eth0.mac ? netConfig.eth0.mac : null;
    obj.wlan0.mac = netConfig && netConfig.wlan0 && netConfig.wlan0.mac ? netConfig.wlan0.mac : null;

    obj.eth0.server.address = netConfig && netConfig.eth0 && netConfig.eth0.server.address ? netConfig.eth0.server.address : "10.0.0.1";
    obj.eth0.server.dhcpFirst = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpFirst ? netConfig.eth0.server.dhcpFirst : null;
    obj.eth0.server.dhcpLast = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLast ? netConfig.eth0.server.dhcpLast : null;
    obj.eth0.server.dhcpLease = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLease ? netConfig.eth0.server.dhcpLease : "12h";
    obj.eth0.server.dhcpPoolSize = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpPoolSize ? netConfig.eth0.server.dhcpPoolSize : 10;
    obj.eth0.server.subnet = netConfig && netConfig.eth0 && netConfig.eth0.server.subnet ? netConfig.eth0.server.subnet : null;
    obj.eth0.server.subnetMask = netConfig && netConfig.eth0 && netConfig.eth0.server.subnetMask ? netConfig.eth0.server.subnetMask : "255.255.255.0";

    obj.wlan0.client.pass = netConfig && netConfig.wlan0 && netConfig.wlan0.client.pass ? netConfig.wlan0.client.pass : "Pa$$w0rd";
    obj.wlan0.client.ssid = netConfig && netConfig.wlan0 && netConfig.wlan0.client.ssid ? netConfig.wlan0.client.ssid : `VL${os.hostname().toUpperCase()}`;

    obj.wlan0.server.address = netConfig && netConfig.wlan0 && netConfig.wlan0.server.address ? netConfig.wlan0.server.address : "10.0.0.1";
    obj.wlan0.server.dhcpFirst = netConfig && netConfig.wlan0 && netConfig.wlan0.server.dhcpFirst ? netConfig.wlan0.server.dhcpFirst : null;
    obj.wlan0.server.dhcpLast = netConfig && netConfig.wlan0 && netConfig.wlan0.server.dhcpLast ? netConfig.wlan0.server.dhcpLast : null;
    obj.wlan0.server.dhcpLease = netConfig && netConfig.wlan0 && netConfig.wlan0.server.dhcpLease ? netConfig.wlan0.server.dhcpLease : "12h";
    obj.wlan0.server.dhcpPoolSize = netConfig && netConfig.wlan0 && netConfig.wlan0.server.dhcpPoolSize ? netConfig.wlan0.server.dhcpPoolSize : 10;
    obj.wlan0.server.subnet = netConfig && netConfig.wlan0 && netConfig.wlan0.server.subnet ? netConfig.wlan0.server.subnet : null;
    obj.wlan0.server.subnetMask = netConfig && netConfig.wlan0 && netConfig.wlan0.server.subnetMask ? netConfig.wlan0.server.subnetMask : "255.255.255.0";

    objKeys.splice(objKeys.indexOf("static"), 1);

    objKeys.forEach(elem => {
      if (!obj[elem].mac) obj[elem].mac = getIfaceMacAddress(elem);
      if (!obj[elem].server.subnet) {
        obj[elem].server.subnet = getIfaceSubNet(obj[elem].server.address, obj[elem].server.subnetMask);
      }
      obj[elem].server.dhcpFirst = obj[elem].server.subnet.contains(ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10))
        ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10)
        : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2);
      obj[elem].server.dhcpLast = obj[elem].server.subnet.contains(
        ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
      )
        ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
        : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2 + obj[elem].server.dhcpPoolSize);
    });
  };

  const publicAPI = {
    getCurrentState: obj,
    initNetwork,
    toggleAP
  };

  return publicAPI;
}

Array.prototype.diff = function(a) {
  return this.filter(i => a.indexOf(i) < 0);
};

module.exports = NetSet;
