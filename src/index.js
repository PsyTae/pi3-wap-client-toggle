/* eslint consistent-return: 0 */

const child = require("child_process");
const ip = require("ip");

function Iface(iface, apConfig, clientConfig) {
  this.iface = iface ? iface.toLowerCase() : "wlan1";
  this.apConfig = apConfig || {
    address: "192.168.254.0",
    dhcpPoolSize: 10,
    subnetMask: "255.255.255.0"
  };
  this.apConfig.dhcp = false;
  this.apConfig.mac = this.getMacAddress(this.iface);
  this.apConfig.subnet = this.getSubNet(
    this.apConfig.address,
    this.apConfig.subnetMask
  );

  this.apConfig.dhcpFirst =
    ip.toBuffer(this.apConfig.subnet.networkAddress) + 11;
  this.apConfig.dhcpLast =
    ip.toBuffer(this.apConfig.subnet.networkAddress) +
    11 +
    this.apConfig.dhcpPoolSize;

  this.clientConfig = clientConfig || {
    ssid: null,
    password: null
  };
  this.clientConfig.dhcp = true;
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