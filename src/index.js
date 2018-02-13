// npm i -D babel-cli babel-preset-env
/* eslint consistent-return: 0, no-param-reassign: 0, no-use-before-define: ["error", { "functions": false }], no-else-return: 0, no-nested-ternary: 0, no-extend-native: 0 */

const child = require("child_process");
const fs = require("fs");
const ip = require("ip");
const os = require("os");
const promisify = require("util").promisify;

Array.prototype.diff = function(a) {
  return this.filter(i => a.indexOf(i) < 0);
};

Array.prototype.inArray = function(comparer) {
  for (let i = 0; i < this.length; i += 1) {
    if (comparer(this[i])) return true;
  }
  return false;
};

Array.prototype.pushIfNotExist = function(element, comparer) {
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

const filesToBackup = [
  "/etc/default/hostapd",
  "/etc/dhcpcd.conf",
  "/etc/dnsmasq.conf",
  "/etc/hostapd/hostapd.conf",
  "/etc/network/interfaces",
  "/etc/wpa_supplicant/wpa_supplicant.conf"
];

const allFiles = [
  "/etc/default/hostapd",
  "/etc/dhcpcd.conf",
  "/etc/dnsmasq.conf",
  "/etc/dnsmasqconfs/eth0.dnsmasq.conf",
  "/etc/dnsmasqconfs/static.dnsmasq.conf",
  "/etc/dnsmasqconfs/wlan0.dnsmasq.conf",
  "/etc/hostapd/hostapd.conf",
  "/etc/network/interfaces",
  "/etc/wpa_supplicant/wpa_supplicant.conf"
];

function NetSet() {
  const obj = {};

  const getIfaceMacAddress = iface =>
    child
      .execFileSync("cat", [`/sys/class/net/${iface}/address`])
      .toString()
      .trim();

  const getIfaceSubNet = (ipAddress, subnet) => ip.subnet(ipAddress, subnet);

  const setStates = async states => {
    // console.log(states);
    // console.dir(obj, { depth: null });

    const stopServices = async () => {
      const execFile = promisify(child.execFile);
      return Promise.all([
        execFile("systemctl", ["stop", "networking"]),
        execFile("systemctl", ["stop", "hostapd"]),
        execFile("systemctl", ["stop", "dnsmasq"]),
        execFile("systemctl", ["stop", "wpa_supplicant"])
      ]);
    };

    const startServices = async () => {
      const execFile = promisify(child.execFile);
      const servicesToStart = [execFile("systemctl", ["start", "dnsmasq"]), execFile("systemctl", ["start", "networking"])];
      switch (true) {
        case states.wlan0.toLowerCase() === "server":
          servicesToStart.push(execFile("systemctl", ["start", "hostapd"]));
          break;
        case states.wlan0.toLowerCase() === "client":
        case states.wlan0.toLowerCase() === "clients":
          servicesToStart.push(execFile("systemctl", ["start", "wpa_supplicant"]));
          break;
        default:
          break;
      }
      try {
        await Promise.all(servicesToStart);
        return true;
      } catch (err) {
        if (err.cmd === "systemctl start networking" && err.code === 1) return true;
        // if (err.cmd === "systemctl start wpa_supplicant") return true;
        return err;
      }
    };

    const createEmptyBackupFile = async file => {
      const writeFile = promisify(fs.writeFile);
      // if error writing to file for any reason it will throw an error
      await writeFile(`${file}.bak`, Buffer.alloc(0));
      return true;
    };

    const makeBackup = async file => {
      // if backup file exists already do nothing further return true.
      if (fs.existsSync(`${file}.bak`)) return true;
      try {
        const copyFile = promisify(fs.copyFile);
        // if backup file doens't exist copy file to file.bak
        await copyFile(file, `${file}.bak`);
        // return true when file is copied to bakup file.
        return true;
      } catch (cpErr) {
        // if file missing create an empty backup file
        if (cpErr.code === "ENOENT") {
          return createEmptyBackupFile(file);
        }
        // if copy error for any other reason return error
        return cpErr;
      }
    };

    const createFileContent = async stateObj => {
      const fileObj = {};
      const availableIfaces = Object.keys(stateObj);

      fileObj["/etc/dnsmasq.conf"] = [
        `bind-interfaces`,
        `bogus-priv`,
        `server=8.8.8.8`,
        `server=8.8.4.4`,
        `listen-address=127.0.0.1`,
        `clear-on-reload`,
        `conf-dir=/etc/dnsmasqconfs/`,
        ``
      ];
      fileObj["/etc/dnsmasqconfs/static.dnsmasq.conf"] = [];
      obj.static.forEach(device => {
        fileObj["/etc/dnsmasqconfs/static.dnsmasq.conf"].push(`dhcp-host=${device.mac},${device.ipAddress},${device.name},infinite`);
      });

      fileObj[`/etc/dhcpcd.conf`] = [
        `hostname`,
        `clientid`,
        `persistent`,
        `option rapid_commit`,
        `option domain_name_servers, domain_name, domain_search, host_name`,
        `option classless_static_routes`,
        `option ntp_servers`,
        `option interface_mtu`,
        `require dhcp_server_identifier`,
        `slaac private`,
        ``
      ];

      fileObj[`/etc/default/hostapd`] = [`DAEMON_CONF=""`, `DAEMON_OPTS=""`, ``];

      fileObj[`/etc/network/interfaces`] = [`source-directory /etc/network/interfaces.d`, ``, `auto lo`, `iface lo inet loopback`, ``];

      availableIfaces.forEach(iface => {
        switch (true) {
          case stateObj[iface].toLowerCase() === "server":
            allFiles.pushIfNotExist(`/etc/dnsmasqconfs/${iface}.dnsmasq.conf`, e => e === `/etc/dnsmasqconfs/${iface}.dnsmasq.conf`);
            fileObj[`/etc/dnsmasqconfs/${iface}.dnsmasq.conf`] = [
              `interface=${iface}`,
              `listen-address=${obj[iface].server.subnet.firstAddress}`,
              `dhcp-range=${iface},${obj[iface].server.dhcpFirst},${obj[iface].server.dhcpLast},${obj[iface].server.subnetMask},${
                obj[iface].server.subnet.broadcastAddress
              },${obj[iface].server.dhcpLease}`,
              ``
            ];

            fileObj[`/etc/network/interfaces`].push(`${iface === "eth0" || iface === "wlan0" ? `auto ${iface}` : `allow-hotplug ${iface}`}`);
            fileObj[`/etc/network/interfaces`].push(`iface ${iface} inet static`);
            fileObj[`/etc/network/interfaces`].push(`    address ${obj[iface].server.subnet.firstAddress}`);
            fileObj[`/etc/network/interfaces`].push(`    gateway ${obj[iface].server.subnet.firstAddress}`);
            fileObj[`/etc/network/interfaces`].push(`    network ${obj[iface].server.subnet.networkAddress}`);
            fileObj[`/etc/network/interfaces`].push(`    netmask ${obj[iface].server.subnet.subnetMask}`);
            fileObj[`/etc/network/interfaces`].push(`    broadcast ${obj[iface].server.subnet.broadcastAddress}`);
            fileObj[`/etc/network/interfaces`].push(``);

            if (obj[iface].server.apInfo) {
              fileObj[`/etc/dhcpcd.conf`].push(`denyinterfaces ${iface}`);
              fileObj[`/etc/dhcpcd.conf`].push(``);

              fileObj[`/etc/default/hostapd`] = [`DAEMON_CONF="/etc/hostapd/hostapd.conf"`, `DAEMON_OPTS=""`, ``];

              fileObj[`/etc/hostapd/hostapd.conf`] = [
                `interface=${iface}`,
                `driver=nl80211`,
                `ssid=${obj[iface].server.apInfo.ssid}`,
                `hw_mode=g`,
                `channel=${obj[iface].server.apInfo.channel}`,
                `ieee80211n=1`,
                `wmm_enabled=0`,
                `macaddr_acl=0`,
                `auth_algs=1`,
                `ignore_broadcast_ssid=${obj[iface].server.apInfo.bradcast ? 0 : 1}`,
                `wpa=2`,
                `wpa_key_mgmt=WPA-PSK`,
                `wpa_passphrase=${obj[iface].server.apInfo.pass}`,
                `rsn_pairwise=CCMP`,
                ``
              ];
            }
            break;
          case stateObj[iface].toLowerCase() === "client":
          case stateObj[iface].toLowerCase() === "clients":
            stateObj[iface] = "clients";
            allFiles.pushIfNotExist(`/etc/dnsmasqconfs/${iface}.dnsmasq.conf`, e => e === `/etc/dnsmasqconfs/${iface}.dnsmasq.conf`);
            fileObj[`/etc/dnsmasqconfs/${iface}.dnsmasq.conf`] = [];

            fileObj[`/etc/network/interfaces`].push(`${iface === "eth0" || iface === "wlan0" ? `auto ${iface}` : `allow-hotplug ${iface}`}`);
            fileObj[`/etc/network/interfaces`].push(`iface ${iface} inet dhcp`);
            fileObj[`/etc/network/interfaces`].push(``);

            if (iface === "wlan0") {
              fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`] = [
                `country=US`,
                `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev`,
                `update_config=1`,
                ``
              ];
              obj[iface].clients.forEach(client => {
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`network={`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`    scan_ssid=1`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`    ssid="${client.ssid}"`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`    psk="${client.pass}"`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`    id_str="${client.name}"`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(`}`);
                fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`].push(``);
              });
            } else {
              fileObj[`/etc/wpa_supplicant/wpa_supplicant.conf`] = [
                `country=US`,
                `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev`,
                `update_config=1`,
                ``
              ];
            }
            break;
          default:
            break;
        }
      });
      return fileObj;
    };

    const deleteFile = async filePath => {
      const unlink = promisify(fs.unlink);
      try {
        await unlink(filePath);
        return true;
      } catch (err) {
        if (err.code === "ENOENT") return true;
        return err;
      }
    };

    const writeToFile = async fileObj => {
      const appendFile = promisify(fs.appendFile);
      for (let i = 0; i < fileObj.content.length; i += 1) {
        const writeRow = fileObj.content[i] + os.EOL;
        await appendFile(fileObj.file, writeRow, "utf8");
      }
      return `${fileObj.file} written to disk.`;
    };

    try {
      const filesToBeModifiedObj = await createFileContent(states);
      const filesToBeModified = [];
      const filesToBeModifiedArray = Object.keys(filesToBeModifiedObj).sort();

      filesToBeModifiedArray.forEach(file => {
        const tempObj = {
          file,
          content: filesToBeModifiedObj[file]
        };
        filesToBeModified.push(tempObj);
      });

      // ensure that there is a backup of all files that could be modified
      await Promise.all(filesToBackup.map(makeBackup));

      // stop services
      await stopServices();

      // delete all files
      await Promise.all(allFiles.map(deleteFile));

      // write content to needed files
      await Promise.all(filesToBeModified.map(writeToFile));

      // start services
      await startServices();

      obj.actingAsHotSpot = states.wlan0.toLowerCase() === "server";

      return Object.assign({}, obj);
    } catch (err) {
      console.error("catch Error:", err);
      return err;
    }
  };

  // if obj.actingAsHotSpot === false needs to be flipped to true by end of if to signify acting as hotspot
  // backup files if originals are not already saved
  // todo: stop services
  // todo: delete allfiles
  // todo: write files needed for configuration
  // todo: start services
  // todo: set obj.actingAsHotSpot = current config for wlan0

  /**
   * Initialize Network
   * @type {boolean} [startAsHotspot=true] - Whether or not to start as hotspot or client
   * @type {netConfig} netConfig - Object used to store all connection info for network setup
   */
  const initNetwork = (startAsHotspot, netConfig) => {
    const states = {};
    const objKeys = Object.keys(obj);
    const configKeys = netConfig ? Object.keys(netConfig) : [];
    obj.actingAsHotSpot = !!startAsHotspot;

    // hanldes anything other than eth0 and wlan0
    configKeys.diff(objKeys).forEach(elem => {
      obj[elem] = elem === "static" ? netConfig[elem] : {};
      if (elem !== "static") obj[elem].mac = netConfig[elem].mac ? netConfig[elem].mac : getIfaceMacAddress(elem);

      if (netConfig[elem].server) {
        states[elem] = "server";
        obj[elem].server = {};
        obj[elem].server.address = netConfig[elem].server.address ? netConfig[elem].server.address : "10.255.255.255";
        obj[elem].server.dhcpLease = netConfig[elem].server.dhcpLease ? netConfig[elem].server.dhcpLease : "12h";
        obj[elem].server.dhcpPoolSize = netConfig[elem].server.dhcpPoolSize ? netConfig[elem].server.dhcpPoolSize : 10;
        obj[elem].server.subnetMask = netConfig[elem].server.subnetMask ? netConfig[elem].server.subnetMask : "255.255.255.0";
        obj[elem].server.subnet = netConfig[elem].server.subnet
          ? netConfig[elem].server.subnet
          : getIfaceSubNet(obj[elem].server.address, obj[elem].server.subnetMask);
        obj[elem].server.dhcpFirst = netConfig[elem].server.dhcpFirst
          ? netConfig[elem].server.dhcpFirst
          : obj[elem].server.subnet.contains(ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10))
            ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10)
            : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2);
        obj[elem].server.dhcpLast = netConfig[elem].server.dhcpLast
          ? netConfig[elem].server.dhcpLast
          : obj[elem].server.subnet.contains(ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize))
            ? ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 10 + obj[elem].server.dhcpPoolSize)
            : ip.fromLong(ip.toLong(obj[elem].server.subnet.networkAddress) + 2 + obj[elem].server.dhcpPoolSize);
      }
      if (netConfig[elem].clients) {
        states[elem] = "clients";
        obj[elem].clients = [];
        netConfig[elem].clients.forEach(connection => {
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
    if (!obj.wlan0.clients)
      obj.wlan0.clients = netConfig && netConfig.wlan0 && netConfig.wlan0.clients && obj.wlan0.clients.length === 0 ? netConfig.wlan0.clients : [];
    if (!obj.wlan0.server) obj.wlan0.server = netConfig && netConfig.wlan0 && netConfig.wlan0.server ? netConfig.wlan0.server : {};

    if (!obj.eth0.mac) obj.eth0.mac = netConfig && netConfig.eth0 && netConfig.eth0.mac ? netConfig.eth0.mac : getIfaceMacAddress("eth0");
    if (!obj.wlan0.mac) obj.wlan0.mac = netConfig && netConfig.wlan0 && netConfig.wlan0.mac ? netConfig.wlan0.mac : getIfaceMacAddress("wlan0");

    if (!obj.eth0.server.address)
      obj.eth0.server.address = netConfig && netConfig.eth0 && netConfig.eth0.server.address ? netConfig.eth0.server.address : "10.0.0.1";
    if (!obj.eth0.server.dhcpLease)
      obj.eth0.server.dhcpLease = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLease ? netConfig.eth0.server.dhcpLease : "12h";
    if (!obj.eth0.server.dhcpPoolSize)
      obj.eth0.server.dhcpPoolSize = netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpPoolSize ? netConfig.eth0.server.dhcpPoolSize : 10;
    if (!obj.eth0.server.subnetMask)
      obj.eth0.server.subnetMask = netConfig && netConfig.eth0 && netConfig.eth0.server.subnetMask ? netConfig.eth0.server.subnetMask : "255.255.255.0";
    if (!obj.eth0.server.subnet)
      obj.eth0.server.subnet =
        netConfig && netConfig.eth0 && netConfig.eth0.server.subnet
          ? netConfig.eth0.server.subnet
          : getIfaceSubNet(obj.eth0.server.address, obj.eth0.server.subnetMask);
    if (!obj.eth0.server.dhcpFirst)
      obj.eth0.server.dhcpFirst =
        netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpFirst
          ? netConfig.eth0.server.dhcpFirst
          : obj.eth0.server.subnet.contains(ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 10))
            ? ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 10)
            : ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 2);
    if (!obj.eth0.server.dhcpLast)
      obj.eth0.server.dhcpLast =
        netConfig && netConfig.eth0 && netConfig.eth0.server.dhcpLast
          ? netConfig.eth0.server.dhcpLast
          : obj.eth0.server.subnet.contains(ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 10 + obj.eth0.server.dhcpPoolSize))
            ? ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 10 + obj.eth0.server.dhcpPoolSize)
            : ip.fromLong(ip.toLong(obj.eth0.server.subnet.networkAddress) + 2 + obj.eth0.server.dhcpPoolSize);

    if (!obj.wlan0.server.apInfo) obj.wlan0.server.apInfo = {};
    if (!obj.wlan0.server.apInfo.bradcast)
      obj.wlan0.server.apInfo.bradcast =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.bradcast
          ? netConfig.wlan0.server.apInfo.bradcast
          : true;
    if (!obj.wlan0.server.apInfo.channel)
      obj.wlan0.server.apInfo.channel =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.channel
          ? netConfig.wlan0.server.apInfo.channel
          : 6;
    if (!obj.wlan0.server.apInfo.pass)
      obj.wlan0.server.apInfo.pass =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.pass
          ? netConfig.wlan0.server.apInfo.pass
          : "Pa$$w0rd";
    if (!obj.wlan0.server.apInfo.ssid)
      obj.wlan0.server.apInfo.ssid =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.apInfo && netConfig.wlan0.server.apInfo.ssid
          ? netConfig.wlan0.server.apInfo.ssid
          : `VL${os.hostname().toUpperCase()}`;

    if (!obj.wlan0.server.address)
      obj.wlan0.server.address =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.address ? netConfig.wlan0.server.address : "10.10.10.1";
    if (!obj.wlan0.server.dhcpLease)
      obj.wlan0.server.dhcpLease =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpLease ? netConfig.wlan0.server.dhcpLease : "12h";
    if (!obj.wlan0.server.dhcpPoolSize)
      obj.wlan0.server.dhcpPoolSize =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpPoolSize ? netConfig.wlan0.server.dhcpPoolSize : 10;
    if (!obj.wlan0.server.subnetMask)
      obj.wlan0.server.subnetMask =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.subnetMask ? netConfig.wlan0.server.subnetMask : "255.255.255.0";

    if (!obj.wlan0.server.subnet)
      obj.wlan0.server.subnet =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.subnet
          ? netConfig.wlan0.server.subnet
          : getIfaceSubNet(obj.wlan0.server.address, obj.wlan0.server.subnetMask);

    if (!obj.wlan0.server.dhcpFirst)
      obj.wlan0.server.dhcpFirst =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpFirst
          ? netConfig.wlan0.server.dhcpFirst
          : obj.wlan0.server.subnet.contains(ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 10))
            ? ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 10)
            : ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 2);

    if (!obj.wlan0.server.dhcpLast)
      obj.wlan0.server.dhcpLast =
        netConfig && netConfig.wlan0 && netConfig.wlan0.server && netConfig.wlan0.server.dhcpLast
          ? netConfig.wlan0.server.dhcpLast
          : obj.wlan0.server.subnet.contains(ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 10 + obj.wlan0.server.dhcpPoolSize))
            ? ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 10 + obj.wlan0.server.dhcpPoolSize)
            : ip.fromLong(ip.toLong(obj.wlan0.server.subnet.networkAddress) + 2 + obj.wlan0.server.dhcpPoolSize);

    const setupWifi = setStates(states);
    setupWifi.then().catch();
  };

  const getCurrentState = () => Object.assign({}, obj);

  const publicAPI = {
    getCurrentState,
    initNetwork,
    setStates
  };

  return publicAPI;
}

module.exports = NetSet;
