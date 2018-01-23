/* eslint consistent-return: 0 */

const child = require("child_process");
const ip = require("ip");
const os = require("os");
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
 */

/**
 * Iface Constructor
 * @param {string} [iface="wlan1"] - interface name such as wlan0
 * @param {clientConfig} clientConfig - Object used to Connect to Outside Network
 * @param {apConfig} apConfig - Object used to Establish a Wireless Access Point
 */
function Iface(iface, clientConfig, apConfig) {
  if (this instanceof Iface) {
    this.iface = iface ? iface.toLowerCase() : "wlan1";
    this.apConfig = {};
    this.clientConfig = {};

    this.apConfig.address = apConfig.address ? apConfig.address : "192.168.254.0";
    this.apConfig.subnetMask = apConfig.subnetMask ? apConfig.subnetMask : "255.255.255.0";
    this.apConfig.subnet = this.getSubNet(this.apConfig.address, this.apConfig.subnetMask);
    this.apConfig.mac = this.getMacAddress(this.iface);
    this.apConfig.dhcpPoolSize = apConfig.dhcpPoolSize ? apConfig.dhcpPoolSize : 10;
    this.apConfig.dhcpLease = apConfig.dhcpLease ? apConfig.dhcpLease : "12h";
    this.apConfig.dhcpFirst = ip.fromLong(ip.toLong(this.apConfig.subnet.networkAddress) + 10);
    this.apConfig.dhcpLast = ip.fromLong(ip.toLong(this.apConfig.subnet.networkAddress) + 10 + this.apConfig.dhcpPoolSize);
    this.apConfig.wapSSID = apConfig.wapSSID ? apConfig.wapSSID : os.hostname().toUpperCase();
    this.apConfig.wapPASS = apConfig.wapPASS ? apConfig.wapPASS : "Pa$$w0rd";

    this.clientConfig.ssid = clientConfig.ssid ? clientConfig.ssid : null;
    this.clientConfig.pass = clientConfig.pass ? clientConfig.pass : null;
  } else return new Iface(iface, clientConfig, apConfig);
}

Iface.prototype.getSubNet = (address, mask) => {
  if (address && mask) return ip.subnet(address, mask);
  return new Error("Unable to find Subnet information");
};

Iface.prototype.getMacAddress = iface =>
  child
    .execFileSync("cat", [`/sys/class/net/${iface}/address`])
    .toString()
    .trim();

module.exports = Iface;
