// npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }] */

import child from "child_process";
import ip from "ip";
import os from "os";
import { promisify } from "util";

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
  let obj = {};

  const getIfaceMacAddress = iface =>
    child
      .execFileSync("cat", [`/sys/class/net/${iface}/address`])
      .toString()
      .trim();

  const getIfaceSubNet = (ipAddress, subnet) => ip.subnet(ipAddress, subnet);

  const execFilePromise = promisify(child.execFile);

  const stopServices = () =>
    new Promise((resolve, reject) => {
      execFilePromise("systemctl", ["stop", "hostapd"])
        .then(execFilePromise("systemctl", ["stop", "dnsmasq"]))
        .then(() => resolve())
        .catch(error => reject(error));
    });

  const startServices = () =>
    new Promise((resolve, reject) => {
      execFilePromise("systemctl", ["start", "dnsmasq"])
        .then(execFilePromise("systemctl", ["start", "hostapd"]))
        .then(() => resolve())
        .catch(error => reject(error));
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
   * Initialize Interface
   * @param {string} [iface="wlan1"] - interface name such as wlan0
   * @param {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @param {clientConfig} clientConfig - Object used to Connect to Outside Network
   * @param {apConfig} apConfig - Object used to Establish a Wireless Access Point
   */
  const initIface = (iface, startAsHotspot, clientConfig, apConfig) => {
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
    obj.apConfig.dhcpFirst = obj.apConfig.subnet.contains(ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 10))
      ? ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 10)
      : ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 2);
    obj.apConfig.dhcpLast = obj.apConfig.subnet.contains(ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 10 + obj.apConfig.dhcpPoolSize))
      ? ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 10 + obj.apConfig.dhcpPoolSize)
      : ip.fromLong(ip.toLong(obj.apConfig.subnet.networkAddress) + 2 + obj.apConfig.dhcpPoolSize);
    obj.apConfig.wapChannel = apConfig.wapChannel ? apConfig.wapChannel : 6;
    obj.apConfig.wapBroadcast = apConfig.wapBroadcast ? apConfig.wapBroadcast : true;
    obj.apConfig.wapSSID = apConfig.wapSSID ? apConfig.wapSSID : os.hostname().toUpperCase();
    obj.apConfig.wapPASS = apConfig.wapPASS ? apConfig.wapPASS : "Pa$$w0rd";

    obj.clientConfig.ssid = clientConfig.ssid ? clientConfig.ssid : null;
    obj.clientConfig.pass = clientConfig.pass ? clientConfig.pass : null;

    // ! if obj.actingAsHotSpot === true then sends false to turn on hostspot
    // ! if obj.actingAsHotSpot === false then sends true to turn on client
    toggleAP(!obj.actingAsHotSpot);
  };

  /**
   * Initialize NEtwork
   * @param {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @param {clientConfig} clientConfig - Object used to Connect to Outside Network
   * @param {apConfig} apConfig - Object used to Establish a Wireless Access Point
   */
  const initNetwork = (startAsHotspot, netConfig) => {
    obj.actingAsHotSpot = startAsHotspot ? !!startAsHotspot : true;

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

    const objKeys = Object.keys(obj);
    objKeys.splice(objKeys.indexOf("actingAsHotSpot"), 1);
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
    initIface,
    initNetwork,
    toggleAP
  };

  return publicAPI;
}

module.exports = Iface;
