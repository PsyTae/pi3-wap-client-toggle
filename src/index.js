/* eslint consistent-return: 0 */

const child = require("child_process");
const ip = require("ip");

function Iface(iface, apConfig, clientConfig) {
  this.iface = iface ? iface.toLowerCase() : "wlan0";
  this.apConfig = apConfig || {
    address: "192.168.254.0",
    dhcp: false,
    mac: this.getMacAddress(this.iface),
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
}
Iface.prototype.getSubNet = () => {
  if (this.apConfig.address && this.apConfig.mask)
    return ip.subnet(this.apConfig.address, this.apConfig.mask);
  return new Error("Unable to find Subnet information");
};

Iface.prototype.getMacAddress = iface =>
  child.execFileSync("cat", [`/sys/class/net/${iface}/address`]);

const getMacAddress = iface =>
  child.execFileSync("cat", [`/sys/class/net/${iface}/address`]);

module.exports = {
  getMacAddress,
  Iface
};
