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

  const getIfaceMacAddress = () =>
    child
      .execFileSync("cat", [`/sys/class/net/${obj.iface}/address`])
      .toString()
      .trim();

  const getIfaceSubNet = () => ip.subnet(obj.apConfig.address, obj.apConfig.subnetMask);

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
    obj = Object.assign({}, obj, netConfig);
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
