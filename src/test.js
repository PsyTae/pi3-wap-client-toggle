const Iface = require("./index");

const wlan1 = new Iface(
  "WLAN1",
  {
    address: "192.168.254.0",
    mask: "255.255.0.0"
  },
  { ssid: "dai", password: "HQWireless!" }
);
const wlan0 = new Iface("WLAN0");
