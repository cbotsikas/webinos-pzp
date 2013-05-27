/**
 *
 * @param {*} [address]
 * @param {string} [friendlyName]
 * @constructor
 */
var webinosAddress = (function () {
    var REGEX_STR = {};
    REGEX_STR.PZH_USER = '[a-zA-Z\\d_-]+(?:\\.[a-zA-Z\\d_-]+)*';
    REGEX_STR.PZH_ADDRESS = '[a-zA-Z\\d]+(?:\\.?\\-*[a-zA-Z\\d]+)*';
    REGEX_STR.PZH = '(' + REGEX_STR.PZH_USER + ')@(' + REGEX_STR.PZH_ADDRESS + ')|(?:standalone)';
    REGEX_STR.DEVICE_ID = '[\\u00BF-\\u1FFF\\u2C00-\\uD7FFa-zA-Z\\d-]+';
    REGEX_STR.APPLICATION_ID = '[a-fA-F\\d]{32}';
    REGEX_STR.SESSION_ID = '\\d+';
    var REGEX = {};
    REGEX.PZH_USER = new RegExp('^' + REGEX_STR.PZH_USER + '$');
    REGEX.PZH_ADDRESS = new RegExp('^' + REGEX_STR.PZH_ADDRESS + '$');
    REGEX.PZH = new RegExp('^' + REGEX_STR.PZH + '$');
    REGEX.DEVICE = new RegExp('\\/D(' + REGEX_STR.DEVICE_ID + ')', 'g');
    REGEX.DEVICE_ID = new RegExp('^' + REGEX_STR.DEVICE_ID + '$');
    REGEX.APPLICATION = new RegExp('\\/A(' + REGEX_STR.APPLICATION_ID + ')', 'g');
    REGEX.APPLICATION_ID = new RegExp('^' + REGEX_STR.APPLICATION_ID + '$');
    REGEX.SESSION = new RegExp('\\/S(' + REGEX_STR.SESSION_ID + ')', 'g');
    REGEX.SESSION_ID = new RegExp('^' + REGEX_STR.SESSION_ID + '$');
    REGEX.ADDRESS = new RegExp('^(' + REGEX_STR.PZH + ')((?:\\/(?:D' + REGEX_STR.DEVICE_ID + '|A' + REGEX_STR.APPLICATION_ID + '|S' + REGEX_STR.SESSION_ID + '))+)?$');

    /**
     * @typedef {{
     *  address:string,
     *  friendly:string
     * }}
     * @constructor
     */
    var Address = function () {
        this.address = "";
        this.friendly = "";
    };

    /**
     * @typedef {{
     *  pzhUser:string,
     *  pzhAddress:string,
     *  deviceId:string,
     *  applicationId:string,
     *  sessionId:string
     * }}
     * @constructor
     */
    var AddressParts = function () {
        this.pzhUser = "";
        this.pzhAddress = "";
        this.deviceId = "";
        this.applicationId = "";
        this.sessionId = "";
    };

    /**
     *
     * @param {*} address
     * @returns {Address}
     */
    var normalizeAddressInput = function (address) {
        if (address instanceof Address)
            return address;
        var normalizedAddress = new Address();
        if (typeof address == 'undefined')
            return normalizedAddress;
        switch (typeof address) {
            case "string":
                normalizedAddress.address = address;
                break;
            case "object":
                if (typeof address.address == "undefined")
                    throw new Error("Supplied object doesn't have address value.");
                if (typeof address.address != "string")
                    throw new Error("Address type \"" + (typeof address.address) + "\" is not supported.");
                normalizedAddress.address = address.address;
                if (typeof address.friendly != "undefined") {
                    if (typeof address.friendly != "string")
                        throw new Error("Friendly name type \"" + (typeof address.friendly) + "\" is not supported.");
                    normalizedAddress.friendly = address.friendly;
                }
                break;
            default :
                throw new Error("Address type \"" + (typeof address) + "\" is not supported.");
        }
        return normalizedAddress;
    };

    /**
     *
     * @param {Address|string} [address]
     * @param {string} [friendlyName]
     * @constructor
     */
    var location = function (address, friendlyName) {
        Address.call(this);
        this.setAddress(address);
        this.setFriendlyName(friendlyName)
    };
    location.prototype.getRegexObj = function () {
        return REGEX;
    };
    /**
     *
     * @param {Address} [address]
     * @returns {AddressParts|bool}
     */
    location.prototype.getAddressParts = function (address) {
        address = normalizeAddressInput((typeof address !== 'undefined') ? address : this.address);
        var addressParts = new AddressParts();
        var parts = [];
        if (address.address !== "" && !(parts = REGEX.ADDRESS.exec(address.address))) {
            //Invalid format
            return false;
        } else {
            addressParts.pzhUser = parts[2] || "";
            addressParts.pzhAddress = parts[3] || "";
            var path = parts[4] || "";
            if (path != "") {
                var matches;
                matches = [];
                path.replace(REGEX.DEVICE, function ($0, $1) {
                    if ($1) matches[matches.length] = $1;
                });
                addressParts.deviceId = (matches.length > 1) ? matches : (matches[0] || "");
                matches = [];
                path.replace(REGEX.APPLICATION, function ($0, $1) {
                    if ($1) matches[matches.length] = $1;
                });
                addressParts.applicationId = (matches.length > 1) ? matches : (matches[0] || "");
                matches = [];
                path.replace(REGEX.SESSION, function ($0, $1) {
                    if ($1) matches[matches.length] = $1;
                });
                addressParts.sessionId = (matches.length > 1) ? matches : (matches[0] || "");
            }
        }
        return addressParts;
    };
    /**
     *
     * @param {bool} [throwErrors]
     * @param {Address|string} [address]
     * @returns {boolean}
     */
    location.prototype.isValid = function (throwErrors, address) {
        throwErrors = !!throwErrors;
        address = normalizeAddressInput((typeof address !== 'undefined') ? address : this.address);
        var addressParts;
        if (!(addressParts = this.getAddressParts(address))) {
            if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid format.");
            return false;
        } else {
            if (!(addressParts.pzhUser == "" && addressParts.pzhAddress == "")) {
                if (!REGEX.PZH_USER.test(addressParts.pzhUser)) {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid pzh user \"" + addressParts.pzhUser + "\".");
                    return false;
                }
                if (!REGEX.PZH_ADDRESS.test(addressParts.pzhAddress)) {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid pzh address \"" + addressParts.pzhAddress + "\".");
                    return false;
                }
            }
            if (addressParts.deviceId !== "") {
                if (typeof addressParts.deviceId != "string") {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has more than one device ids \"" + JSON.stringify(addressParts.deviceId) + "\".");
                    return false;
                }
                if (!REGEX.DEVICE_ID.test(addressParts.deviceId)) {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid device Id \"" + addressParts.deviceId + "\".");
                    return false;
                }
            }
            if (addressParts.applicationId !== "") {
                if (typeof addressParts.applicationId != "string") {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has more than one application ids \"" + JSON.stringify(addressParts.applicationId) + "\".");
                    return false;
                }
                if (!REGEX.APPLICATION_ID.test(addressParts.applicationId)) {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid application id \"" + addressParts.applicationId + "\".");
                    return false;
                }
                if (addressParts.deviceId == "") {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has an application id without a device id.");
                    return false;
                }
            }
            if (addressParts.sessionId !== "") {
                if (typeof addressParts.sessionId != "string") {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has more than one session ids \"" + JSON.stringify(addressParts.sessionId) + "\".");
                    return false;
                }
                if (!REGEX.SESSION_ID.test(addressParts.sessionId)) {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has invalid session id \"" + addressParts.sessionId + "\".");
                    return false;
                }
                if (addressParts.applicationId == "") {
                    if (throwErrors) throw new Error("Address \"" + address.address + "\" has a session id without an application id.");
                    return false;
                }
            }
        }
        return true;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getPzh = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        if (parts.pzhUser == "" && parts.pzhAddress == "") {
            return "standalone";
        } else {
            return parts.pzhUser + "@" + parts.pzhAddress;
        }
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getPzhUser = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        return parts.pzhUser;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getPzhAddress = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        return parts.pzhAddress;
    };
    /**
     *
     * @param {string} [user]
     * @param {string} [pzhAddress]
     * @returns {location}
     */
    location.prototype.setPzh = function (user, pzhAddress) {
        var parts = this.getAddressParts();
        user = (typeof user !== 'undefined') ? user : "";
        pzhAddress = (typeof pzhAddress !== 'undefined') ? pzhAddress : "";
        var fullAddress;
        if (arguments.length == 1 || pzhAddress === "") {
            fullAddress = user;
        } else {
            fullAddress = user + "@" + pzhAddress;
        }
        var newAddress = [];
        if (fullAddress !== "" && !(newAddress = REGEX.PZH.exec(fullAddress))) {
            throw new Error("PZH \"" + fullAddress + "\" doesn't have valid format.");
        } else {
            parts.pzhUser = newAddress[1] || "";
            parts.pzhAddress = newAddress[2] || "";
        }
        if (newAddress = this.getAddress(parts))
            this.address = newAddress;
        return this;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getDeviceId = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        return parts.deviceId;
    };
    /**
     *
     * @param {string} deviceId
     * @returns {location}
     */
    location.prototype.setDeviceId = function (deviceId) {
        var parts = this.getAddressParts();
        var newAddress;
        deviceId = (typeof deviceId !== 'undefined') ? deviceId : "";
        if (deviceId !== "" && !(REGEX.DEVICE_ID.test(deviceId))) {
            throw new Error("Device Id \"" + deviceId + "\" doesn't have valid format.");
        }
        if (deviceId == "") {
            parts.applicationId = "";
            parts.sessionId = "";
        }
        parts.deviceId = deviceId;
        if (newAddress = this.getAddress(parts))
            this.address = newAddress;
        return this;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getApplicationId = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        return parts.applicationId;
    };
    /**
     *
     * @param {string} applicationId
     * @returns {location}
     */
    location.prototype.setApplicationId = function (applicationId) {
        var parts = this.getAddressParts();
        var newAddress;
        applicationId = (typeof applicationId !== 'undefined') ? applicationId : "";
        if (applicationId !== "" && !(REGEX.APPLICATION_ID.test(applicationId))) {
            throw new Error("Application Id \"" + applicationId + "\" doesn't have valid format.");
        }
        if (applicationId !== "" && parts.deviceId == "")
            throw new Error("You can't set an application id without a device id.");
        if (applicationId == "")
            parts.sessionId = "";
        parts.applicationId = applicationId;
        if (newAddress = this.getAddress(parts))
            this.address = newAddress;
        return this;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getSessionId = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        return parts.sessionId;
    };
    /**
     *
     * @param {string} sessionId
     * @returns {location}
     */
    location.prototype.setSessionId = function (sessionId) {
        var parts = this.getAddressParts();
        var newAddress;
        sessionId = (typeof sessionId !== 'undefined') ? sessionId : "";
        if (sessionId !== "" && !(REGEX.SESSION_ID.test(sessionId))) {
            throw new Error("Session Id \"" + sessionId + "\" doesn't have valid format.");
        }
        if (sessionId !== "" && parts.applicationId == "")
            throw new Error("You can't set a session id without an application id.");
        parts.sessionId = sessionId;
        if (newAddress = this.getAddress(parts))
            this.address = newAddress;
        return this;
    };
    /**
     *
     * @param {Address|string} [address]
     * @returns {location}
     */
    location.prototype.setAddress = function (address) {
        address = normalizeAddressInput(address);
        if (this.isValid(true, address)) {
            this.address = address.address;
            this.friendly = address.friendly;
        }
        return this;
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getAddress = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        var address = this.getPzh(parts);
        if (parts.deviceId != "") address += "/D" + parts.deviceId;
        if (parts.applicationId != "") address += "/A" + parts.applicationId;
        if (parts.sessionId != "") address += "/S" + parts.sessionId;
        return (this.isValid(false, address)) ? address : "";
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getAddressDevice = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        var address = this.getPzh(parts);
        if (parts.deviceId != "") {
            address += "/D" + parts.deviceId;
            return (this.isValid(false, address)) ? address : "";
        }
        return "";
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getAddressApplication = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        var address = this.getPzh(parts);
        if (parts.deviceId != "") {
            address += "/D" + parts.deviceId;
            if (parts.applicationId != "") {
                address += "/A" + parts.applicationId;
                return (this.isValid(false, address)) ? address : "";
            }
        }
        return "";
    };
    /**
     *
     * @param {AddressParts} [addressParts]
     * @returns {string}
     */
    location.prototype.getAddressSession = function (addressParts) {
        var parts = (addressParts instanceof AddressParts) ? addressParts : this.getAddressParts();
        var address = this.getPzh(parts);
        if (parts.deviceId != "") {
            address += "/D" + parts.deviceId;
            if (parts.applicationId != "") {
                address += "/A" + parts.applicationId;
                if (parts.sessionId != "") {
                    address += "/S" + parts.sessionId;
                    return (this.isValid(false, address)) ? address : "";
                }
            }
        }
        return "";
    };
    /**
     *
     * @returns {string}
     */
    location.prototype.getFriendlyName = function () {
        return this.friendly;
    };
    /**
     *
     * @param {string} [friendlyName]
     * @returns {location}
     */
    location.prototype.setFriendlyName = function (friendlyName) {
        friendlyName = (typeof friendlyName !== 'undefined') ? friendlyName : "";
        if (typeof friendlyName !== "string") {
            throw new Error("Friendly Name \"" + friendlyName + "\" doesn't have valid format.");
        }
        this.friendly = friendlyName;
        return this;
    };
    /**
     *
     * @returns {string}
     */
    location.prototype.toString = function () {
        return this.getAddress();
    };

    return location;
})();