/* eslint consistent-return: 0 */

const child = require("child_process");
const ip = require("ip");

const Iface = (iface, apConfig, clientConfig) => {
  this.iface = iface ? iface.toLowerCase() : "wlan0";
  this.apConfig = apConfig || {
    address: "192.168.254.0",
    dhcp: false,
    cidr: "192.168.254.0/24",
    mac: this.getMacAddress(),
    mask: "255.255.255.0",
    subnet: this.getSubNet()
  };
  this.clientConfig = clientConfig || {
    dhcp: true,
    ssid: null,
    password: null
  };
  console.log("IFACE:", this.iface);
  console.dir(this.config, { depth: null, colors: true });
};

Iface.prototype.getMacAddress = () =>
  child.execFileSync("cat"[`/sys/class/net/${this.iface}/address`]);

Iface.prototype.getSubNet = () => {
  if (this.apConfig.cidr) return ip.cidrSubnet(this.apConfig.cidr);
  if (this.apConfig.address && this.apConfig.mask)
    return ip.subnet(this.apConfig.address, this.apConfig.mask);
};

const getMacAddress = () =>
  child.execFileSync("cat"[`/sys/class/net/${this.iface}/address`]);

module.exports = {
  getMacAddress,
  Iface
};
