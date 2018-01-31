// npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }] */

import child from "child_process";
import ip from "ip";
import os from "os";
import { promisify } from "util";

function Network() {
  let obj = {};

  const getIfaceMacAddress = iface =>
    child
      .execFileSync("cat", [`/sys/class/net/${iface}/address`])
      .toString()
      .trim();

  const getIfaceSubNet = (ipAddress, subnet) => ip.subnet(ipAddress, subnet);

  const addKeyPair = elem =>
    new Promise((resolve, reject) => {
      try {
        if (!obj[elem].mac) obj[elem].mac = getIfaceMacAddress(elem);
        if (!obj[elem].server.subnet) {
          obj[elem].server.subnet = getIfaceSubNet(obj[elem].server.address, obj[elem].server.subnetMask);
          obj[elem].server.dhcpFirst = obj[elem].server.subnet.contains(ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10))
            ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10)
            : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2);
          obj[elem].server.dhcpLast = obj[elem].server.subnet.contains(
            ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
          )
            ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
            : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2 + obj[elem].server.dhcpPoolSize);
        }
        console.log(elem, obj[elem]);
        return resolve(obj[elem]);
      } catch (err) {
        return reject(err);
      }
    });
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

  const initNetwork = async (startAsHotspot, setupObj) => {
    obj = Object.assign({}, setupObj);

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
    obj.eth0.server.dhcpPoolSize =
      setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.dhcpPoolSize ? setupObj.eth0.server.dhcpPoolSize : 10;
    obj.eth0.server.subnet = null;
    obj.eth0.server.subnetMask =
      setupObj && setupObj.eth0 && setupObj.eth0.server && setupObj.eth0.server.subnetMask ? setupObj.eth0.server.subnetMask : "255.255.255.0";

    obj.wlan0.client.pass =
      setupObj && setupObj.wlan0 && setupObj.wlan0.client && setupObj.wlan0.client.pass ? setupObj.wlan0.client.pass : `VL${os.hostname().toUpperCase()}`;
    obj.wlan0.client.ssid = setupObj && setupObj.wlan0 && setupObj.wlan0.client && setupObj.wlan0.client.ssid ? setupObj.wlan0.client.ssid : "Pa$$w0rd";

    obj.wlan0.mac = null;

    obj.wlan0.server.address =
      setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.address ? setupObj.wlan0.server.address : "10.10.10.1";
    obj.wlan0.server.dhcpFirst = null;
    obj.wlan0.server.dhcpLast = null;
    obj.wlan0.server.dhcpLease =
      setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.dhcpLease ? setupObj.wlan0.server.dhcpLease : "12h";
    obj.wlan0.server.dhcpPoolSize =
      setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.dhcpPoolSize ? setupObj.wlan0.server.dhcpPoolSize : 10;
    obj.wlan0.server.subnet = null;
    obj.wlan0.server.subnetMask =
      setupObj && setupObj.wlan0 && setupObj.wlan0.server && setupObj.wlan0.server.subnetMask ? setupObj.wlan0.server.subnetMask : "255.255.255.0";

    const objKeys = Object.keys(obj);

    objKeys.splice(objKeys.indexOf("actingAsHotSpot"), 1);
    objKeys.splice(objKeys.indexOf("static"), 1);

    Promise.all(objKeys.map(addKeyPair)).then(console.dir(obj, { depth: null, colors: true }));

    /*
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
*/
    // ! if obj.actingAsHotSpot === true then sends false to turn on hostspot
    // ! if obj.actingAsHotSpot === false then sends true to turn on client
    // toggleAP(!obj.actingAsHotSpot);
  };

  const publicAPI = {
    getCurrentState: obj,
    initNetwork,
    toggleAP
  };

  return publicAPI;
}

module.exports = Network;
