!function (e) {
    window.unreadAmount = 0;
    function t() { }
    !function (e) {
        var n = t;
        class r {
            constructor(e, n) {
                var r = t;
                this.charMap = new Map,
                    this["scale"] = 1,
                    this.spaceMissingCharacters = !1,
                    this["forceSharpPixels"] = !1,
                    this["bold"] = !1,
                    this.italic = false,
                    null != e && this["fetchFont"](e, n)
            }
            ["fetchFont"](e, r) {
                var a = n
                    , o = this
                    , i = new XMLHttpRequest;
                i.onreadystatechange = function () {
                    var e = t;
                    4 == i["readyState"] && 200 == i["status"] && (o["parseFont"](i.responseText),
                        null != r && r())
                }
                    ,
                    i["open"]("GET", e, !0),
                    i["send"](null)
            }
            ["parseFont"](e) {
                var t = n
                    , r = e["split"]("\n");
                const a = r["length"];
                for (var o = 0; o < a; o++) {
                    var i = r[o];
                    if (!i.startsWith("#")) {
                        var c = i["split"](":");
                        if (2 == c.length) {
                            for (var l = parseInt(c[0], 16), u = c[1], s = u["length"], d = new Uint8Array(s / 2), f = 0; f < s; f += 2)
                                d[f / 2] = parseInt(u.slice(f, f + 2), 16);
                            this.charMap.set(l, d)
                        }
                    }
                }
            }
            ["exportFont"]() {
                var e = n
                    , t = "";
                for (const [n, o] of this["charMap"].entries()) {
                    var r = "";
                    r += n["toString"](16)["padStart"](4, "0").toUpperCase(),
                        r += ":";
                    for (var a = 0; a < o.length; a++)
                        r += o[a]["toString"](16)["padStart"](2, "0")["toUpperCase"]();
                    t += r += "\n"
                }
                return t
            }
            drawChar(e, t, r, a) {
                var o = n
                    , i = e.codePointAt()
                    , c = this.charMap["get"](i);
                if (null == c)
                    return this["spaceMissingCharacters"] ? 8 * this["scale"] : 0;
                var l = c["length"]
                    , u = l / 16
                    , s = (this["bold"] ? 2 : 1) * this["scale"]
                    , d = 1 * this["scale"];
                this["forceSharpPixels"] && (s = Math["ceil"](s),
                    d = Math.ceil(d));
                for (var f = 0; f < l; f++) {
                    var v = c[f]
                        , m = this["italic"] ? Math.round((f - l) / 3) : 0
                        , h = Math["floor"](f / u) * this.scale;
                    this.forceSharpPixels && (h = Math["round"](h));
                    for (var y = 0; y < 8; y++)
                        if (v >> y & 1) {
                            var g = (8 * (Math.floor(f % u) + 1) - y - m) * this.scale;
                            this["forceSharpPixels"] && (g = Math["round"](g)),
                                t.fillRect(r + g, a + h, s, d)
                        }
                }
                return 8 * u * this["scale"]
            }
            ["drawText"](e, t, r, a) {
                for (var o = n, i = r, c = a, l = Array["from"](e), u = 0; u < l["length"]; u++) {
                    var s = l[u];
                    "\r" != s && ("\n" != s ? r += this.drawChar(s, t, r, a) : (a += 16 * this.scale,
                        r = i))
                }
                return {
                    x: r - i,
                    y: (a += 16 * this["scale"]) - c
                }
            }
        }
        var a, o = "/";
        const i = document.getElementById("textarea")
            , c = document["getElementById"]("connecting")
            , l = document["getElementById"]("info")
            , u = -1 != navigator.userAgent["indexOf"]("iPhone") || -1 != navigator["userAgent"]["indexOf"]("iPod") || -1 != navigator.userAgent.indexOf("iPad")
            , s = -1 != navigator["userAgent"]["indexOf"]("Firefox")
            , d = u ? 40 : 200
            , f = new Date;
        var colorsDisabled = false;
        var brailleDisabled = false;
        var v = devicePixelRatio
            , m = !1
            , h = document["title"]

            , y = !0;
        const g = document["getElementById"]("toast");
        var p;
        const b = document["getElementById"]("clipboard")
            , x = document["getElementById"]("usermenu")
            , w = document["getElementById"]("colourlist")
            , M = document["getElementById"]("teleport");
        var k = document["getElementById"]("canvas");
        k["removeAttribute"]("id");
        var E = k.getContext("2d", {
            alpha: !1
        });
        k["width"] = Math.round(window["innerWidth"] * v),
            k["height"] = Math["round"](window.innerHeight * v),
            k["style"]["width"] = window["innerWidth"] + "px",
            k["style"]["height"] = window["innerHeight"] + "px",
            E.imageSmoothingEnabled = !1;
        var renderChunkAmount = localStorage.getItem("rca") || (rot && rot.value && parseInt(rot.value)) || 100;
        const S = "#FFFFFF"
            , I = "#EBEBEB";
        var C = S
            , A = I
            , T = Xr(A, 10);
        const B = document.getElementById("primary")
            , F = document["getElementById"]("secondary")
            , P = document["getElementById"]("themetext")
            , L = document["getElementById"]("thememenu")
            , O = document.getElementById("customfont")
            , R = document["getElementById"]("customfontsize")
            , D = document["getElementById"]("fontmenu");
        var N = 0;
        var j = 0
            , U = !1
            , W = ""
            , H = ""
            , K = !1;
        const X = document["getElementById"]("wallsettings")
            , z = document["getElementById"]("addmembers")
            , q = document["getElementById"]("walllist");
        var Y;
        const J = document["getElementById"]("deletewall")
            , V = String.fromCharCode(10240)
            , Z = String["fromCharCode"](27)
            , $ = {
                Inconsolata: 18,
                "IBM Plex Mono": 16,
                "Roboto Mono": 16,
                "Courier Prime": 16,
                Courier: 16,
                "Cutive Mono": 18,
                Cousine: 16,
                Unifont: 16,
                Terminus: 16,
                Fixed: 16,
                monospace: 18,
                "Ubuntu Mono": 20,
                "Libertinus Mono": 16,
                Fixedsys: 18,
                Pointfree: 16,
                Monofur: 18,
                "Fantasque Sans Mono": 18,
                "JetBrains Mono": 18,
                Hack: 18,
                "Fira Code": 18,
                "Space Mono": 18,
                "Anonymous Pro": 16,
                "Source Code Pro": 18,
                Iosevka: 18,
                "Cascadia Mono": 18,
                "Noto Sans Mono": 16,
                "PxPlus IBM VGA8": 16,
                Menlo: 16,
                Consolas: 16,
                "Andale Mono": 16,
                "Lucida Console": 16,
                Monaco: 16,
                "DM Mono": 16,
                "Quicksand Mono": 18,
                Custom: 20,
            };

        var G = "Inconsolata"
            , Q = Math.floor($[G] * v) + "px Iosveka, " + G + ", monospace, Special";
        const _ = new Map;
        _["set"]("Unifont", void 0),
            _["set"]("Terminus", void 0),
            _["set"]("Fixed", void 0);
        const ee = Object.keys($)["length"]
            , te = document["getElementById"]("fontselect");
        for (var ne = 0; te["length"] > 0; ne++)
            ;
        for (ne = 0; ne < ee; ne++)
            option = document["createElement"]("option"),
                option["text"] = Object.keys($)[ne],
                te.add(option);
        te["value"] = G;
        const re = document.getElementById("decorations");
        re["addEventListener"]("contextmenu", (function (e) {
            e["preventDefault"]()
        }
        ));
        const ae = {
            bold: {
                el: document["getElementById"]("bold"),
                enabled: !1
            },
            italic: {
                el: document["getElementById"]("italic"),
                enabled: !1
            },
            underline: {
                el: document.getElementById("underline"),
                enabled: !1
            },
            strikethrough: {
                el: document.getElementById("strikethrough"),
                enabled: !1
            }
        };
        var oe = Object.keys(ae);
        for (ne = 0; ne < oe.length; ne++)
            ae[oe[ne]].el.addEventListener("click", pr);
        function ie(e) {
            var t, r, a = n;
            if (e) {
                re["style"].display = "flex";
                var o = (t = Ce.x,
                    r = Ce.y,
                {
                    x: t * (10 * v) / devicePixelRatio + qe["offset"].x / devicePixelRatio,
                    y: r * (20 * v) / devicePixelRatio + qe.offset.y / devicePixelRatio
                });
                o.x + 15 * v + re["clientWidth"] > window["innerWidth"] ? re.style["left"] = o.x - re["clientWidth"] - 5 * at + "px" : re["style"]["left"] = o.x + 15 * at + "px",
                    re["style"]["top"] = Math["max"](o.y - re["clientHeight"], 0) + "px"
            } else
                re["style"]["display"] = "none"
        }
        function ce() {
            var e = n
                , t = 0;
            return ae.bold.enabled && (t |= 8),
                ae.italic.enabled && (t |= 4),
                ae.underline.enabled && (t |= 2),
                ae.strikethrough.enabled && (t |= 1),
                t
        }
        window.cel = ce;
        function le(e) {
            var t = n;
            br("bold", Boolean(8 & e)),
                br("italic", Boolean(4 & e)),
                br("underline", Boolean(2 & e)),
                br("strikethrough", Boolean(1 & e))
        }
        const ue = 192
            , se = ["#000000", "#898D90", "#D4D7D9", "#FF99AA", "#FF4500", "#FFA800", "#9C6926", "#FFD635", "#7EED56", "#00CC78", "#51E9F4", "#3690EA", "#2450A4", "#B44AC0", "#811E9F", "#BE0039", "#00A368", "#00756F", "#009EAA", "#493AC1", "#6A5CFF", "#FF3881", "#6D482F", "#6D001A", "#FFF8B8", "#00CCC0", "#94B3FF", "#E4ABFF", "#DE107F", "#FFB470", "#515252"]
            , de = ["black", "gray", "light gray", "light pink", "red", "orange", "brown", "yellow", "light green", "green", "light blue", "blue", "dark blue", "purple", "dark purple", "dark red", "dark green", "dark teal", "teal", "indigo", "periwinkle", "pink", "dark brown", "burgundy", "pale yellow", "light teal", "lavender", "pale purple", "magenta", "beige", "dark gray"]
            , fe = [0, 30, 1, 2, 23, 15, 4, 5, 7, 24, 16, 9, 8, 17, 18, 25, 12, 11, 10, 19, 20, 26, 14, 13, 27, 28, 21, 3, 22, 6, 29];

        // addons
        const rgbse = [
            [200, 50, 50],     // muted red
            [80, 180, 60],     // muted green
            [60, 100, 200],    // muted blue
            [220, 180, 60],    // mustard yellow
            [220, 140, 60],    // soft orange
            [140, 80, 150],    // muted purple
            [240, 160, 170],   // pastel pink
            [130, 80, 50],     // earthy brown
            [70, 200, 200],    // cyan-ish, softer
            [200, 100, 180],   // pink-magenta
            [180, 180, 180],   // light silver/gray
            [120, 120, 120],   // muted gray
            [60, 130, 130],    // teal-ish
            [50, 120, 60],     // depp forest green
            [130, 50, 50],     // muted maroon
            [50, 50, 120],     // muted navy
            [220, 200, 50],    // soft gold
            [160, 200, 240],   // soft light blue
            [140, 220, 140],   // soft light green
            [220, 100, 80]     // muted tomato
        ];

        const rgbde = [
            "muted red",        // [200,50,50]
            "soft green",       // [80,180,60]
            "muted blue",       // [60,100,200]
            "mustard yellow",   // [220,180,60]
            "soft orange",      // [220,140,60]
            "muted purple",     // [140,80,150]
            "pastel pink",      // [240,160,170]
            "earthy brown",     // [130,80,50]
            "soft cyan",        // [70,200,200]
            "pink-magenta",     // [200,100,180]
            "light silver",     // [180,180,180]
            "muted grey",       // [120,120,120]
            "teal-ish",         // [60,130,130]
            "deep forest green",// [50,120,60]
            "muted maroon",     // [130,50,50]
            "muted navy",       // [50,50,120]
            "soft gold",        // [220,200,50]
            "soft light blue",  // [160,200,240]
            "soft light green", // [140,220,140]
            "muted tomato"      // [220,100,80]
        ];
        function ve(e) {
            for (var t = n, r = 0; r < se["length"]; r++)
                if (fe[r] == e)
                    return r;
            return -1
        }
        var me = [];
        !function () {
            var e = n;
            for (ne = 0; ne < se["length"]; ne++)
                try {
                    me[ne] = Yr(se[ne], .2);
                } catch (t) {
                    me[ne] = "rgba(128, 128, 128, 0.2)";
                }
            me[se["length"]] = "rgba(255, 255, 255, 0.2)"
        }();
        var he, ye, ge, pe = 0, be = Yr(se[pe], .2), xe = !1, we = new Map, Me = [], ke = [], Ee = new Map, Se = new Worker("/static/ping.js"), Ie = !1, Ce = {
            x: 0,
            y: 0,
            rawx: 0,
            rawy: 0,
            visible: !0,
            start: 0,
            lastedit: {
                x: 0,
                y: 0
            }
        }, Ae = {
            x: 0,
            y: 0
        }, Te = {
            x: 0,
            y: 0
        }, Be = [], Fe = [], Pe = new Map, Le = !0, Oe = !0, Re = !0, De = !1, Ne = [], je = "", Ue = 0, We = 0, He = document["getElementById"]("coords"), Ke = document.getElementById("nearby"), Xe = performance["now"](), ze = {
            scale: 1,
            offset: {
                x: 0,
                y: 0
            }
        }, qe = {
            start: {
                x: null,
                y: null
            },
            offset: {
                x: 0,
                y: 0
            },
            coords: {
                x: 0,
                y: 0
            }
        }, Ye = !1, Je = !1, Ve = !1, Ze = !1, $e = {}, Ge = [], Qe = null, _e = [];
        for (ne = 0; ne < 200; ne++)
            _e[ne] = " ";
        var et = [];

        for (ne = 0; ne < 200; ne++)
            et[ne] = 0;
        document.getElementById("fontselect")["onchange"] = function (e) {
            var t = n;
            vt(e["target"]["value"])
        }
            ;
        const tt = {
            showothercurs: document.getElementById("showothercurs"),
            shownametags: document["getElementById"]("shownametags"),
            showchat: document["getElementById"]("showchat"),
            disablecolour: document.getElementById("disablecolour"),
            smoothpanning: document["getElementById"]("smoothpanning"),
            smoothcursors: document.getElementById("smoothcursors"),
            copycolour: document["getElementById"]("copycolour"),
            copydecorations: document["getElementById"]("copydecorations"),
            rainbow: document["getElementById"]("rainbow"),
            anonymous: document["getElementById"]("anonymous"),
            darkChat: document.getElementById("darkChat"),
            rainbowTag: document.getElementById("rainbowTag"),
            fps: document.getElementById("fps"),
            showFeedback: document.getElementById("showFeedback"),
            anonIdShow: document.getElementById("anonIdShow"),
            roundCursors: document.getElementById("roundCursors"),
            displayNames: document.getElementById("displayNames"),
            fadeInMsg: document.getElementById("fadeInMsg"),
            //doNotChangeTheme: document.getElementById("doNotChangeTheme")
            hueSpeed: document.getElementById("hueSpeed"),
            rainbowMode: document.getElementById("rainbowMode"),
            showTypingStatus: document.getElementById("showTypingStatus")
        };
        tt.showothercurs["checked"] = !0,
            tt["shownametags"]["checked"] = !0,
            tt.showchat["checked"] = !0,
            tt["disablecolour"]["checked"] = !1,
            tt["smoothpanning"]["checked"] = !0,
            tt["smoothcursors"].checked = !0,
            tt["showFeedback"].checked = !0,
            tt["anonIdShow"].checked = !0,
            tt["rainbowTag"].checked = !0,
            tt["roundCursors"].checked = !0,
            tt["displayNames"].checked = !1,
            tt["fadeInMsg"].checked = !0;
        tt["showTypingStatus"].checked = !0;
        tt.hueSpeed.value = localStorage.getItem("hueSpeed") ?? 5;
        tt.rainbowMode.value = localStorage.getItem("rainbowMode") ?? "legacy";
        /* tt["doNotChangeTheme"].checked = !1;*/
        const nt = {
            protect: document["getElementById"]("protect"),
            clear: document.getElementById("clear"),
            readOnly: document["getElementById"]("readonly"),
            private: document.getElementById("private"),
            hideCursors: document["getElementById"]("hidecursors"),
            disableChat: document["getElementById"]("disablechat"),
            disableColour: document["getElementById"]("walldisablecolour"),
            disableBraille: document.getElementById("disablebraille"),
            unlisted: document.getElementById("unlisted"),
            nsfw: document.getElementById("nsfw"),
            regonly: document.getElementById("regonly"),
            wallthemeprotectcustom: document.getElementById("wallthemeprotectcustom"),
            wallthemecustom: document.getElementById("wallthemecustom"),
            _theme: document.getElementById("_theme"),
            webhook: document.getElementById("webhook")
        };
        var rt = 1
            , at = 1
            , ot = document["getElementById"]("zoom")
            , rot = document["getElementById"]("fca");
        function it(e, t) {
            var r = n;
            rt = e < .5 ? .5 : e > 3 ? 3 : e,
                at = Math.round(100 * rt) / 100,
                localStorage["setItem"]("zoom", at),
                ot["value"] = 10 * at,
                t && ir(Math["round"](100 * at) + "% ", 1e3),
                kn()
        }
        function rit(e) {
            localStorage["setItem"]("rca", e.target.value)
        }
        function ct() {
            it(ot["value"] / 10, !0)
        }
        var lt = document["getElementById"]("registerlink")
            , ut = document["getElementById"]("loginlink")
            , st = document.getElementById("logoutlink");
        function dt(e, t) {
            var r = n;
            e && (localStorage.removeItem("username"),
                localStorage["removeItem"]("token")),
                je = "",
                j = 0,
                X.style["display"] = "none",
                a.readyState != a["OPEN"] || t || (nt.private["checked"] && Cn("textwall", "main"),
                    a.send(Or({
                        logout: 0
                    })),
                    Re = !0),
                document["getElementById"]("login")["style"]["display"] = "block",
                document.getElementById("loggedin")["style"].display = "none",
                vn(!1),
                xn(),
                m = !1,
                document["getElementById"]("admin")["style"]["display"] = "none",
                ge = !0
        }
        function ft() {
            var e = n;
            return 16 * Math["round"](v) > 20 * v || 16 * Math["round"](v) < 13 * v ? v : Math["round"](v)
        }
        function vt(e) {
            var t = n;
            if (G = e,
                _["has"](G)) {
                var a = _.get(G);
                if (null == a) {
                    switch (G) {
                        case "Unifont":
                            a = new r("/static/fonts/unifont-15.0.01.hex", Sn);
                            break;
                        case "Terminus":
                            a = new r("/static/fonts/terminus.hex", Sn);
                            break;
                        default:
                            a = new r("/static/fonts/fixed.hex", Sn)
                    }
                    a["forceSharpPixels"] = !0,
                        _["set"](G, a)
                }
                a["scale"] = ft()
            }
            var o = G
                , i = $[G];
            "Custom" == G ? (D["classList"].remove("hidden"),
                o = O["value"],
                i = Math["max"](Math["min"](20, R["value"]), 1),
                localStorage["setItem"]("customfont", o),
                localStorage["setItem"]("customfontsize", i),
                o = '"' + (o || "monospace") + '"') : D.classList["add"]("hidden"),
                Q = Math["floor"](i * v) + "px " + o + ", monospace, Special",
                localStorage["setItem"]("font", G),
                document.getElementById("fontselect")["value"] = G,
                ge = !0
        }
        function mt() {
            var e = n;
            return Math["ceil"](.1 * Math["round"](Et * v / .1))
        }
        function ht() {
            return mt()
        }
        function yt(e) {
            var t = n;
            E["fillRect"](Math["round"](10 * e[0] * v), Math.round(20 * e[1] * v), mt(), ht())
        }
        function gt(e) {
            var t = n;
            e.font = Math["round"](11 * v) + "px " + G + ", monospace"
        }
        function pt(e, t) {
            var r = n
                , a = we["get"](e);
            if (a.empty) {
                E.fillStyle = a.protected ? A : C,
                    yt(t);
            } else {
                var o = a["img"];
                s && (o = a["bmp"]),
                    null != o ? (E["drawImage"](o, Math["round"](10 * t[0] * v), Math.round(20 * t[1] * v), mt(), ht()),
                        a["dpr"] == v && a.font == Q || St(e, !1)) : (E.fillStyle = T,
                            yt(t),
                            St(e, !1))
            }
            if (!a.protected && a.textProtected) {
                var cellW = mt() / 20
                    , cellH = ht() / 10;
                E.fillStyle = A;
                for (var idx = 0; idx < 200; idx++)
                    if (a.textProtected[idx] === "1") {
                        var cellX = idx % 20
                            , cellY = Math.floor(idx / 20);
                        E.fillRect(Math.round(10 * t[0] * v + cellX * cellW), Math.round(20 * t[1] * v + cellY * cellH), Math.ceil(cellW), Math.ceil(cellH))
                    }
            }
        }
        function bt(e) {
            var t = n;
            return e = e || 0,
            {
                minx: -qe["offset"].x / v / 10 - e,
                maxx: -qe.offset.x / v / 10 + window.innerWidth / at / 10 + e - 20,
                miny: -qe["offset"].y / v / 20 - e,
                maxy: -qe["offset"].y / v / 20 + window["innerHeight"] / at / 20 + e - 10
            }
        }
        function xt(e, t) {
            var r = n;
            return e[0] < t.minx || e[0] > t["maxx"] || e[1] < t.miny || e[1] > t["maxy"]
        }


        function wt(e) {
            var t = n;
            return we["get"](e)["coords"] || e["split"](",")
        }
        function Mt(e, t, r, a) {
            var o = n;
            if ("" != e) {
                E["fillStyle"] = "rgba(34, 34, 34, 0.4)";
                var i = E["measureText"](e);
                E.beginPath(),
                    E.roundRect(Math["round"](t - i.width / 2), Math["round"](r + 21 * v), Math["round"](i["width"] + 10 * v), Math["round"](14 * v), [a]),
                    E["fill"](),
                    E["fillStyle"] = "#FFFFFF",
                    E.fillText(e, Math.round(t - i["width"] / 2 + 5 * v), Math["round"](r + 31 * v))
            }
        }
        function kt(e, t, r, a, i = 0) {
            var o = n;
            if (i > 0) {
                E["roundRect"](Math["round"](e), Math["round"](t), Math["round"](r), Math["round"](a), i)
            } else {
                E["fillRect"](Math["round"](e), Math["round"](t), Math["round"](r), Math["round"](a))
            }
        }

        !function () {
            var e = n;
            E["font"] = "10px Special",
                E["fillText"]("abc", 0, 10),
                E["font"] = Q,
                E["fillText"]("abc", 0, 10);
            for (var t = 0; t < Object.keys($)["length"]; t++)
                E.font = "10px " + Object.keys($)[t],
                    E["fillText"]("abc", 0, 10),
                    E["font"] = "bold 10px " + Object["keys"]($)[t],
                    E.fillText("abc", 0, 10),
                    E.font = "italic 10px " + Object["keys"]($)[t],
                    E["fillText"]("abc", 0, 10),
                    E.font = "italic bold 10px " + Object["keys"]($)[t],
                    E.fillText("abc", 0, 10)
        }();
        const Et = 200;
        function St(e, t) {
            var r = n;
            Ee["has"](e) ? 0 == Ee["get"](e) && t && Ee["set"](e, t) : (ke["push"](e),
                Ee["set"](e, t))
        }
        function It(e, t) {
            var r = n;
            Ee["has"](e) ? 0 == Ee["get"](e) && t && Ee["set"](e, t) : (ke["unshift"](e),
                Ee["set"](e, t))
        }

        var Ct, At, Tt;
        try {
            Ct = RegExp("\\p{Extended_Pictographic}", "u")
        } catch (e) {
            Ct = !1
        }
        try {
            At = RegExp("\t", "gm")
        } catch (e) {
            At = !1
        }
        try {
            Tt = RegExp("\r", "gm")
        } catch (e) {
            Tt = !1
        }
        var Bt = RegExp("^[a-zA-Z0-9_-]{1,24}$");
        function Ft(e) {
            return 65 + Math["floor"](26 * e)
        }
        function Pt(e) {
            return 48 + Math.floor(10 * e)
        }
        function Lt(e) {
            return "AEIOU"[Math["floor"](5 * e)].codePointAt()
        }
        function Ot(e) {
            var t = n;
            return "BCDFGHJKLMNPQRSTVWXYZ"[Math["floor"](21 * e)]["codePointAt"]()
        }
        function Rt(e) {
            const t = Math.random();
            switch (e - 58112) {
                case 0:
                    return t < .41 ? Ft(t) + 32 : t < .83 ? Ft(t) : Pt(t);
                case 1:
                    return t < .72 ? Ft(t) + 32 : Pt(t);
                case 2:
                    return t < .72 ? Ft(t) : Pt(t);
                case 3:
                    return t < .5 ? Ft(t) + 32 : Ft(t);
                case 4:
                    return Ft(t) + 32;
                case 5:
                    return Ft(t);
                case 6:
                    return Pt(t);
                case 7:
                    return t < .5 ? Lt(t) + 32 : Lt(t);
                case 8:
                    return Lt(t) + 32;
                case 9:
                    return Lt(t);
                case 10:
                    return t < .5 ? Ot(t) + 32 : Ot(t);
                case 11:
                    return Ot(t) + 32;
                case 12:
                    return Ot(t)
            }
            return 97
        }
        function Dt(e) {
            return (e + 2) % 20 < 2
        }
        function Nt(e) {
            var t = n;
            return Math["round"](16 * e) + "px Courier"
        }
        function jt(e, t, r, a, o) {
            var i = n;
            e["fillText"](t, Math.floor(r), Math["floor"](a + 15 * o))
        }
        function Ut(e, t, r, a, o, i, c) {
            var l = n;
            e["drawChar"](r, t, Math["floor"](a), Math["floor"](o + (10 * i - c / 2)))
        }
        function Wt(e) {
            var t = n;
            e["font"] = "bold " + e.font
        }
        function Ht(e) {
            var t = n;
            e["font"] = "italic " + e.font
        }
        function Kt(e, t) {
            var r = n;
            tt["disablecolour"]["checked"] && (t = 0);

            if (Array.isArray(t)) {

                var rgb888 = t;
                e["fillStyle"] = "rgb(" + rgb888[0] + "," + rgb888[1] + "," + rgb888[2] + ")";
            } else {

                e["fillStyle"] = xe && 0 == t ? "#FFFFFF" : se[t];

            }
        }
        function Xt(e, t) {
            var r = n
                , a = we["get"](e);
            if (null != a && null != a["txt"]) {
                var o = zt(e);
                if (a["empty"] = o,
                    o) {
                    qt(e);
                    var i = wt(e)
                        , c = i[0] + 20 + "," + i[1];
                    if (we["has"](c)) {
                        var l = we.get(c);
                        null != l["txt"] && (zt(c) ? (l["empty"] = !0,
                            qt(c)) : t && It(c, !1))
                    }
                } else {
                    var u = mt()
                        , d = ht();
                    null == a["img"] && (null != window["OffscreenCanvas"] ? a["img"] = new OffscreenCanvas(u, d) : a["img"] = document["createElement"]("canvas")),
                        a.img["width"] = u,
                        a.img["height"] = d,
                        function (e, t, n, a, o) {
                            var i = r
                                , c = we["get"](a);
                            e["imageSmoothingEnabled"] = !1,
                                e.textBaseline = "alphabetic",
                                e["textAlign"] = "left",
                                e.fillStyle = c.protected ? A : C,
                                e["fillRect"](0, 0, t, n);
                            var l, u, s = {}, d = !1, f = wt(a), v = f[0] - 20 + "," + f[1];
                            if (we["has"](v)) {
                                var m = we.get(v);
                                null == m.edge || !m.protected && c["protected"] || (l = m["edge"])
                            }
                            for (var h, y = t / Et, g = _["get"](G), p = 16 * ft(), b = 0; b < 10; b++)
                                for (var x = -2; x < 20; x++) {
                                    var w = t / 20 * x
                                        , M = n / 10 * b;
                                    if (x < 0 && null != l) {
                                        var k = x + 20 * b;

                                        if (null != l[k]) {
                                            var E = l[k];
                                            Kt(e, E[2]),
                                                null != g && g["charMap"]["has"](E[0]["codePointAt"]()) ? (g["bold"] = E[3],
                                                    g["italic"] = E[4],
                                                    Ut(g, e, E[0], w, M, y, p)) : (e["font"] = E[1] ? Nt(y) : Q,

                                                        E[3] && Wt(e),
                                                        E[4] && Ht(e),
                                                        jt(e, E[0], w, M, y))
                                        }
                                    }
                                    if (!(x < 0)) {
                                        var S = c["txt"][x + 20 * b]
                                            , clrVal = c.clr[x + 20 * b]
                                            , I = Array.isArray(clrVal) ? [clrVal, clrVal[3] || 0] : Zr(clrVal)
                                            , T = I[1];

                                        var cellProtected = c["textProtected"] && c["textProtected"][x + 20 * b] === "1";
                                        if (cellProtected && !c.protected) {
                                            e.fillStyle = A;
                                            e.fillRect(Math.floor(w), Math.floor(M), Math.ceil(t / 20), Math.ceil(n / 10));
                                        }
                                        if (!Qn(S, T)) {
                                            var B = S["codePointAt"]()
                                                , F = I[0];
                                            Kt(e, F),
                                                e["font"] = Q;
                                            var P = !1;
                                            8 & T && (P = !0,
                                                Wt(e));
                                            var L = !1;
                                            if (4 & T && (L = !0,
                                                Ht(e)),
                                                (h = B) >= 58112 && h <= 58124 && (B = Rt(B),
                                                    S = String["fromCodePoint"](B)),
                                                (u = B) >= 9472 && u <= 9632 && !(u >= 9476 && u <= 9483) && !(u >= 9548 && u <= 9551) || u >= 9698 && u <= 9701 || qr(B))
                                                e["font"] = Math["round"](20 * y) + "px Special",
                                                    e["fillText"](S, Math["round"](w), Math["floor"](M + 15 * y));
                                            else {
                                                var O = !1;
                                                Ct && Ct["test"](S) && (O = !0,
                                                    e["font"] = Nt(y)),
                                                    null != g && g["charMap"]["has"](B) ? (g["bold"] = P,
                                                        g["italic"] = L,
                                                        Ut(g, e, S, w, M, y, p)) : jt(e, S, w, M, y),
                                                    x >= 18 && (s[x - 20 + 20 * b] = [S, O, F, P, L],
                                                        d = !0)
                                            }


                                            2 & T && e["fillRect"](Math["floor"](w - .5 * y), Math["round"](M + 17.5 * y), Math["ceil"](11 * y), Math["ceil"](y)),
                                                1 & T && e.fillRect(Math["floor"](w - .5 * y), Math["floor"](M + 9 * y), Math.ceil(11 * y), Math["ceil"](y));

                                        }
                                    }
                                }
                            if (c["edge"] = d ? s : void 0,
                                o) {
                                var R = f[0] + 20 + "," + f[1];
                                we.has(R) && null != we["get"](R)["txt"] && It(R, !1)
                            }
                        }(a["img"]["getContext"]("2d", {
                            alpha: !1
                        }), u, d, e, t),
                        a["dpr"] = v,
                        a["font"] = Q,
                        s && createImageBitmap(a["img"])["then"]((function (t) {
                            var n = r;
                            if (we["has"](e)) {
                                var a = we["get"](e);
                                null != a.bmp && a["bmp"]["close"](),
                                    a["bmp"] = t,
                                    ge = !0
                            }
                        }
                        )),
                        a["empty"] = !1
                }
            }
        }
        function zt(e) {
            for (var t = n, r = we["get"](e), a = !0, o = 0; o < 200; o++)
                if (!Qn(r.txt[o], Zr(r["clr"][o])[1])) {
                    a = !1;
                    break
                }
            if (a && r.textProtected) {
                for (o = 0; o < 200; o++)
                    if (r.textProtected[o] === "1") {
                        a = !1;
                        break
                    }
            }
            if (a && (r["edge"] = void 0),
                a) {
                var i = wt(e)
                    , c = i[0] - 20 + "," + i[1];
                we["has"](c) && null != we["get"](c).edge && (a = !1)
            }
            return a
        }
        function qt(e) {
            var t = n;
            if (we.has(e)) {
                var r = we["get"](e);
                null != r["img"] && delete r.img
            }
        }
        var Yt = null;
        function Jt(e, t) {
            var r = n;
            return null != Yt && Yt["minx"] <= e && e < Yt.maxx && Yt["miny"] <= t && t < Yt["maxy"]
        }
        function Vt(e, t) {
            return e[0] === t[0] ? 0 : e[0] < t[0] ? -1 : 1
        }
        function Zt(e) {
            for (var t = n, r = innerWidth / innerHeight, a = [], o = qe["coords"].x, i = 2 * qe.coords.y * r, c = 0; c < e.length; c += 2) {
                var l = e[c] + 10
                    , u = 2 * (e[c + 1] + 5) * r
                    , s = Math["sqrt"](Jr(o - l) + Jr(i - u));
                a["push"]([s, c])
            }
            return a["sort"](Vt),
                a
        }


        var $t, Gt = !1;
        function Qt() {
            var e = n;
            if (!Gt) {
                for (var t = -120 - 20 * Math["floor"](qe["offset"].x / (200 * v)), r = -60 - 10 * Math["floor"](qe["offset"].y / (200 * v)), o = r, i = Math.floor(window.innerWidth / (10 * at) - qe["offset"].x / (10 * v) + 120), c = Math.floor(window["innerHeight"] / (20 * at) - qe["offset"].y / (20 * v) + 60), l = []; t < i;) {
                    for (; r < c;) {
                        var u = t + "," + r;
                        !we["has"](u) && Jt(t, r) && l["push"](t, r),
                            r += 10
                    }
                    r = o,
                        t += 20
                }
                if (0 != l["length"]) {
                    var s = Zt(l);
                    $t = [];
                    for (var d = 0, f = 0; f < s["length"]; f++) {
                        var m = s[f][1]
                            , h = l[m]
                            , y = l[m + 1];
                        if (u = h + "," + y,
                            $t["push"](h / 20, y / 10),
                            we["set"](u, {}),

                            parseInt(renderChunkAmount || (rot.value || 100)) == ++d)
                            break
                    }
                    d > 0 && (a["send"](Or({
                        r: $t
                    })),
                        Gt = !0,
                        ge = !0)
                }
            }
        }
        let diejx = false
        function _t() {
            var e, t = n, r = "pathname";
            for (const n of we["keys"]()) {
                var a = wt(n);
                !xt(a, r) || (e = a)[0] > Ce.x - 20 && e[0] < Ce.x + 20 && e[1] > Ce.y - 10 && e[1] < Ce.y + 10 || we.delete(n)
            }
        }
        function en() {
            var e = n;
            "ontouchstart" in window || i["focus"]()
        }
        var tn = !1;
        function nn(e) {
            var t = n;
            if (e.isTrusted) {
                var r = 20 * Math["floor"](Ce.x / 20)
                    , o = 10 * Math["floor"](Ce.y / 10)
                    , c = r + "," + o;
                we["has"](c) && (Ve && a["send"](Or({
                    p: c
                })),
                    Ze && (tn ? tn = !1 : a["send"](Or({
                        c: [r, o, r + 19, o + 9]
                    }))),
                    i["focus"]())
            }
        }
        function rn(e) {
            var t = n;
            return e.target["parentElement"]["parentElement"].dataset.id
        }
        function an(e) {
            m && a["send"](Or({
                i: rn(e)
            }))
        }
        function on(e) {
            var t = n;
            m && a["send"](Or({
                a: [rn(e), e["target"]["checked"]]
            }))
        }
        function cn(e) {
            m && a["send"](Or({
                aa: rn(e)
            }))
        }
        function ln(e) {
            var t = n
                , r = rn(e)
                , a = Pe["get"](r);
            null != a && m && (a["highlighted"] = e["target"]["checked"],
                ge = !0)
        }
        function un(e) {
            var t = n
                , r = e["target"]["parentElement"]["dataset"].id
                , a = Pe.get(r);
            null != a && m && ir((a.n || r) + ": (" + a.l[0] + ", " + -a.l[1] + ")", 3e3)
        }
        function sn(e) {
            var t = n
                , r = e["target"].parentElement["dataset"].id
                , a = Pe["get"](r);
            null != a && m && Zn(a.l[0], a.l[1])
        }
        function dn(e) {
            var t = n
                , r = document["createElement"]("tr")
                , a = document["createElement"]("td")
                , o = document["createElement"]("td")
                , i = document["createElement"]("td")
                , c = document.createElement("input")
                , l = document.createElement("input")
                , u = document.createElement("button")
                , s = document["createElement"]("button");
            l["type"] = "checkbox",
                l["checked"] = !1,
                u["innerText"] = "2",
                s.innerText = "3",
                l["addEventListener"]("click", on),
                u["addEventListener"]("click", cn),
                s["addEventListener"]("click", an),
                c.addEventListener("click", ln);
            var d = Pe["get"](e);
            c["type"] = "checkbox",
                c["checked"] = 1 == d["highlighted"],
                a.appendChild(c);
            var f = d.c;
            o["style"].backgroundColor = "#FFFFFF" == se[f] ? "#222222" : se[f],
                o.style["fontSize"] = "10px",
                o["style"].userSelect = "all",
                o["innerText"] = d.n || e,
                o.addEventListener("click", un),
                o["addEventListener"]("dblclick", sn),
                i.appendChild(l),
                i["appendChild"](u),
                i["appendChild"](s),
                r["dataset"].id = e,
                r["appendChild"](a),
                r["appendChild"](o),
                r["appendChild"](i),
                document["getElementById"]("admintable")["appendChild"](r)
        }
        function fn(e) {
            e["preventDefault"]()
        }
        function vn(e) {
            for (var t = n, r = ["loginbtn", "registerbtn", "loginname", "loginpass", "username", "password", "password2", "registerbtn", "chngusername", "chngeusrpass", "submitnamechange", "oldpass", "newpass", "newpass2", "submitpasschange", "deletepassword", "deleteaccount"], a = 0; a < r["length"]; a++)
                document.getElementById(r[a]).disabled = e;
            if (!e) {
                var o = ["loginname", "loginpass", "username", "password", "password2", "chngusername", "chngeusrpass", "oldpass", "newpass", "newpass2", "deletepassword"];
                for (a = 0; a < o["length"]; a++)
                    document["getElementById"](o[a])["value"] = ""
            }
        }
        k["addEventListener"]("pointerdown", (function (e) {
            var t = n;
            e.preventDefault(),
                e["isTrusted"] && (ie(!1),
                    null != Dn && 1 != e.pointerId || Nn || (Dn = e["pointerId"],
                        Te = Wn(e),
                        Je ? ($e["start"] = Te,
                            $e["end"] = $e.start) : (Ye = !0,
                                qe["start"].x = e["clientX"] * v,
                                qe["start"].y = e["clientY"] * v,
                                Ge = [],
                                Qe = null,
                                Rn(e),
                                k.style["cursor"] = "move",
                                function (e) {
                                    var n = t;
                                    if (e["pointerId"] == Dn) {
                                        nr();
                                        var r = Wn(e);
                                        if (Ce.x == r.x && Ce.y == r.y || (Le = !0),
                                            Ce.x = r.x,
                                            Ce.y = r.y,
                                            Ce.start = Ce.x,
                                            e["altKey"]) {
                                            var a = rr();
                                            a && (Qn(a[0], Zr(a[1])[1]) ? mr(0) : mr(Zr(a[1])[0]))
                                        }
                                        Hn()
                                    }
                                }(e)),
                        ge = !0))
        }
        )),
            k["addEventListener"]("contextmenu", (function (e) {
                e["preventDefault"](),
                    ie(!0)
            }
            )),
            document.addEventListener("pointermove", (function (e) {
                var t = n;
                if (e["isTrusted"] && (Te = Wn(e),
                    (Ve || Ze) && (ge = !0),
                    e["pointerId"] == Dn && !Nn)) {
                    if (e["preventDefault"](),
                        Je) {
                        if (currentRegionSelection.tiled) {
                            $e.end.tileX = Math.floor(Te.x / 20);
                            $e.end.tileY = Math.floor(Te.y / 10);
                            var startX = Math.min($e.end.tileX, $e.start.tileX);
                            var startY = Math.min($e.end.tileY, $e.start.tileY);
                            var endX = Math.max($e.end.tileX, $e.start.tileX);
                            var endY = Math.max($e.end.tileY, $e.start.tileY);
                            $e.start.x = startX * 20;
                            $e.start.y = startY * 10;
                            $e.end.x = endX * 20 + 19;
                            $e.end.y = endY * 10 + 9;
                        } else {
                            $e.end = Te;
                        }
                    }
                    else if (Ye) {
                        var r = e.clientX * devicePixelRatio - qe.start.x / at
                            , a = e["clientY"] * devicePixelRatio - qe["start"].y / at;
                        qe["offset"].x = Math["round"](ze["offset"].x + r),
                            qe["offset"].y = Math["round"](ze["offset"].y + a),
                            tt["smoothpanning"]["checked"] && Rn(e)
                    }
                    ge = !0
                }
            }
            )),
            k["addEventListener"]("click", nn);
        var lastScrollTime = 0;
        k.addEventListener("wheel", (function (e) {
            var t = n;
            if (e["isTrusted"] && (ie(!1), !Ye)) {
                if (e["preventDefault"](), e["ctrlKey"]) {
                    it(rt - e["deltaY"] / 1e3, !0);
                }
                else if (e["altKey"]) {
                    e.preventDefault();

                    var now = Date.now();
                    if (now - (window.lastScrollTime || 0) < 10) return;
                    window.lastScrollTime = now;

                    var colourList = document.getElementById("colourlist");
                    var swatches = Array.from(colourList.querySelectorAll(".swatch-p, .swatch-a"));
                    var selectedSwatch = colourList.querySelector(".selected");

                    if (swatches.length > 0) {
                        var currentIndex = swatches.indexOf(selectedSwatch);
                        var direction = e.deltaY > 0 ? 1 : -1;
                        var nextIndex = (currentIndex + direction + swatches.length) % swatches.length;
                        var nextSwatch = swatches[nextIndex];

                        if (nextSwatch.classList.contains("swatch-p")) {
                            mr(parseInt(nextSwatch.dataset.index));
                        }
                        else if (nextSwatch.classList.contains("swatch-a")) {
                            var bgColor = window.getComputedStyle(nextSwatch).backgroundColor;
                            var rgb = bgColor.match(/\d+/g);

                            if (rgb && rgb.length >= 3) {
                                mr([parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])]);
                                document.querySelectorAll(".swatch-a.selected, .swatch-p.selected").forEach(el => el.classList.remove("selected"));
                                nextSwatch.classList.add("selected");
                            }
                        }

                        nextSwatch.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    }
                }
                else {
                    var r = e.deltaX,
                        a = e["deltaY"];
                    e.shiftKey && (r ^= a, r ^= a ^= r);
                    Mn(qe["offset"].x - r, qe.offset.y - a);
                }
                ge = !0;
            }
        }), { passive: !1 });
        document["addEventListener"]("pointerup", (function (e) {
            var t = n;
            if (e["isTrusted"] && (e["preventDefault"](),
                e["pointerId"] == Dn && !Nn)) {
                if (Je && $e["start"] && $e["end"]) {
                    var r = Math.min($e.start.x, $e["end"].x)
                        , o = Math["min"]($e.start.y, $e["end"].y)
                        , i = Math["max"]($e.start.x, $e["end"].x)
                        , c = Math["max"]($e.start.y, $e["end"].y);
                    Je = false;
                    $e = {};
                    Dn = void 0;
                    var regionSelection = window.currentRegionSelection;
                    window.currentRegionSelection = null;

                    regionSelection.onSelectionEvents.forEach(func => {
                        try {
                            func(r, o, i, c);
                        } catch (e) {
                            console.error("Region selection event handler error:", e);
                        }
                    });

                } else if (Dn = void 0,
                    Ye = !1,
                    qe["start"].x = null,
                    qe["start"].y = null,
                    Mn(qe["offset"].x, qe.offset.y),
                    tt.smoothpanning["checked"]) {
                    Rn(e);
                    var w = Ge["length"] - 1;
                    ((Qe = {
                        dx: Ge[0][0] - Ge[w][0],
                        dy: Ge[0][1] - Ge[w][1],
                        dt: Ge[0][2] - Ge[w][2]
                    }).dt > 90 || Math.abs(Qe.dx) < 5 && Math["abs"](Qe.dy) < 5) && (Qe = null)
                }
                k["style"]["cursor"] = "text",
                    ge = !0
            }
        }
        )),
            document["addEventListener"]("pointerleave", Un),
            document["addEventListener"]("pointercancel", Un),
            i["addEventListener"]("input", (function (e) {

                var t = n;
                if (e.preventDefault(),
                    e["isTrusted"]) {
                    if ("insertLineBreak" != e["inputType"])
                        return "deleteContentBackward" == e["inputType"] ? (Ce.x -= 1,
                            Vn(" ", 0, !1, !0) ||
                            void nr()) : void (null != e["data"] && "" != e["data"] && "insertFromPaste" != e["inputType"] && (nr(),
                                Array["from"](e.data).length > 1 ? tr(e["data"]) : Vn(e["data"], 1)));
                    cr()
                }
            }
            )),

            i["addEventListener"]("keydown", (function (e) {
                var t = n;
                if (e["isTrusted"]) {
                    switch (e["keyCode"]) {
                        case 38:
                            window.w.moveCursor("up", 1);
                            e.preventDefault();
                            break;
                        case 40:
                            window.w.moveCursor("down", 1);
                            e.preventDefault();
                            break;
                        case 37:
                            window.w.moveCursor("left", 1);
                            e.preventDefault();
                            break;
                        case 39:
                            window.w.moveCursor("right", 1);
                            e.preventDefault();
                            break;
                        case 9:
                            window.w.moveCursor("right", 3);
                            e.preventDefault();
                            break;
                        case 36:
                            Ce.x = Ce["start"],
                                nr(),
                                ie(!1),
                                e["preventDefault"]();
                            break;
                        case 46:
                            Vn(" ", 0, !1, !0),
                                nr(),
                                e["preventDefault"]()
                    }
                    (!e["ctrlKey"] && !e["shiftKey"] && !e["altKey"] || 37 == e["keyCode"] || 38 == e["keyCode"] || 39 == e["keyCode"] || 40 == e["keyCode"]) && Hn()
                }
            }
            )),
            something = function (e) { return eval(e) },
            undoWrite = window.undoWrite = function () {
                if (Be.length > 0) {
                    var n = Be.shift();

                    Ce.x = n[0];
                    Ce.y = n[1];

                    var r = pe,
                        a = ce(),
                        o = Zr(n[3]);
                    pe = o[0];
                    window.color = pe;
                    le(o[1]);

                    Vn(n[2], 0, true);
                    pe = r;
                    window.color = pe;
                    le(a);
                }
            },
            redoWrite = window.redoWrite = function () {
                var e = r;
                if (0 != Fe["length"]) {
                    var t = Fe["shift"]();
                    Ce.x = t[0],
                        Ce.y = t[1];
                    var n = pe
                        , a = ce()
                        , o = Zr(t[3]);
                    pe = o[0],
                        window.color = pe,
                        le(o[1]),
                        Vn(t[2], 1, !1),
                        pe = n,
                        window.color = pe,
                        le(a)
                }
            },
            updateUndoRedoUI = function () {
                var undoBtn = document.getElementById("undo");
                var redoBtn = document.getElementById("redo");
                if (Be.length > 0) {
                    undoBtn.classList.remove("disabled");
                } else {
                    undoBtn.classList.add("disabled");
                }
                if (Fe.length > 0) {
                    redoBtn.classList.remove("disabled");
                } else {
                    redoBtn.classList.add("disabled");
                }
            },
            document["addEventListener"]("keydown", (function (e) {
                var r = n;
                if (e.isTrusted)
                    switch (e.keyCode) {
                        case 90:
                            e.ctrlKey && (undoWrite(),
                                e["preventDefault"]());
                            break;
                        case 89:
                            e["ctrlKey"] && (redoWrite(),
                                e["preventDefault"]());
                            break;
                        case 67:
                            e["altKey"] && or(e);
                            break;
                        case 71:
                            e["ctrlKey"] && (e["preventDefault"](),
                                dr());
                            break;
                        case 66:
                            e.ctrlKey && (e["preventDefault"](),
                                br("bold", null, document.getElementById("bold")),
                                ie(!0));
                            break;
                        case 73:
                            e.ctrlKey && (e.preventDefault(),
                                br("italic", null, document.getElementById("italic")),
                                ie(!0));
                            break;

                        case 85:
                            e.ctrlKey && (e["preventDefault"](),
                                br("underline", null, document.getElementById("underline")),
                                ie(!0));
                            break;
                        case 83:
                            e["ctrlKey"] && (e["preventDefault"](),
                                br("strikethrough", null, document.getElementById("strikethrough")),
                                ie(!0));
                            break;
                        case 18:
                            e["preventDefault"]();
                            break;
                        case 27:
                            Je && (Je = !1,
                                $e = {},
                                k.style["cursor"] = "text",
                                e["preventDefault"]()),
                                M["classList"]["remove"]("open"),
                                ie(!1),
                                nr();
                            break;
                        case 107:
                        case 187:
                            e["ctrlKey"] && (e["preventDefault"](),
                                it(rt + .1, !0));
                            break;
                        case 109:
                        case 189:
                            e["ctrlKey"] && (e.preventDefault(),
                                it(rt - .1, !0))
                    }
            }
            )),
            i.addEventListener("paste", (function (e) {
                var t = n;
                e["isTrusted"] && tr((e["clipboardData"] || window["clipboardData"]).getData("text"))
            }
            )),
            i["addEventListener"]("copy", (function (e) {
                var t = n
                    , r = rr();
                if (r) {
                    ar(r[0]),
                        e["preventDefault"](),
                        e["clipboardData"] || ir("Copied character.", 1e3);
                    var a = document["getElementById"]("copyico");
                    a["src"] = "/static/done.svg",
                        setTimeout((function () {
                            var e = t;
                            a["src"] = "/static/copy.svg"
                        }
                        ), 1e3),
                        i["focus"]()
                }
            }
            )),
            Ke["addEventListener"]("click", (function () {
                ir(We + " online", 3e3)
            }
            )),
            He.addEventListener("click", (function () {
                var e = n;
                history["pushState"]({}, null, o),
                    ar(location.protocol + "//" + location["host"] + o + "?x=" + Ce.x + "&y=" + -Ce.y),
                    ir("Copied link.", 1e3),
                    i["focus"]()
            }
            )),

            document["getElementById"]("openmenu").addEventListener("click", (function () {
                document.getElementById("colourcontainer").classList.toggle("hidden")
            }
            ))
            ,

            document.getElementById("options_").addEventListener("click", () => {
                diejx = !diejx;

                if (diejx) {
                    document.body.classList.add("menu-open");
                    sidemenu.classList.add("open");

                } else {
                    document.body.classList.remove("menu-open");
                    sidemenu.classList.remove("open");

                }
            });


        document["getElementById"]("home")["addEventListener"]("click", (function () {
            $n(),
                Zn(0, 0)
        }
        )),
            document["getElementById"]("home")["addEventListener"]("contextmenu", (function (e) {
                var t = n;
                e["preventDefault"](),
                    Cn("textwall", "main") && Zn(0, 0)
            }
            )),
            document["getElementById"]("copy")["addEventListener"]("click", or),
            document["getElementById"]("paste")["addEventListener"]("click", (function () {
                var e = n;
                navigator["clipboard"]["readText"]()["then"]((function (t) {
                    var n = e;
                    tr(t);
                    var r = document["getElementById"]("pasteico");
                    r.src = "/static/done.svg",
                        setTimeout((function () {
                            r["src"] = "/static/paste.svg"
                        }
                        ), 1e3),
                        en()
                }
                ))
            }
            )),
            document.getElementById("theme").addEventListener("click", (function () {
                yr()
            }
            )),
            B["addEventListener"]("input", gr),
            F["addEventListener"]("input", gr),
            P["addEventListener"]("change", (function (e) {
                gr(e),
                    yr(2)
            }
            )),
            O.addEventListener("input", (function () {
                vt(G)
            }
            )),
            R["addEventListener"]("input", (function () {
                vt(G)
            }
            )),
            document["getElementById"]("goto")["addEventListener"]("click", dr),
            sidemenu["addEventListener"]("click", (function (e) {
                var t = n
                    , r = JSON["stringify"](e["target"]["checked"]);
                switch (e.target) {
                    case tt["showothercurs"]:
                        localStorage["setItem"]("showothercurs", r),
                            ge = !0;
                        break;
                    case tt["shownametags"]:
                        localStorage.setItem("shownametags", r),
                            ge = !0;
                        break;
                    case tt["showchat"]:
                        localStorage["setItem"]("showchat", r),
                            e["target"]["checked"] ? hn.classList["remove"]("hidden") : hn.classList["add"]("hidden");
                        break;
                    case tt.disablecolour:
                        localStorage.setItem("disablecolour", r),
                            nt.disableColour["checked"] || hr(tt["disablecolour"].checked),
                            ge = !0,
                            Sn();
                        break;
                    case tt["smoothpanning"]:
                        localStorage["setItem"]("smoothpanning", r),
                            ge = !0;
                        break;
                    case tt["smoothcursors"]:
                        localStorage["setItem"]("smoothcursors", r);
                        break;
                    case tt["copycolour"]:
                        localStorage["setItem"]("copycolour", r);
                        break;
                    case tt["copydecorations"]:
                        localStorage["setItem"]("copydecorations", r);
                        break;
                    case tt["rainbow"]:
                        localStorage["setItem"]("rainbow", r);
                        break;
                    case tt.anonymous:
                        localStorage["setItem"]("anonymous", r),
                            Re = !0,
                            ge = !0;
                        break;
                    case tt.anonIdShow:
                        ge = true;
                        break;
                    case tt.roundCursors:
                        ge = true,
                            localStorage["setItem"]("roundCursors", r);
                        break;
                    case tt.displayNames:
                        ge = true,
                            localStorage["setItem"]("displayNames", r);
                        break;
                    case tt.fadeInMsg:
                        localStorage["setItem"]("fadeInMsg", r);
                        break;
                    case tt.showTypingStatus:
                        localStorage["setItem"]("typingStatus", r)
                        break;
                    /* case tt.doNotChangeTheme:
                         localStorage["setItem"]("doNotChangeTheme", r);
                         break;*/
                    case lt:
                        document["getElementById"]("login")["style"]["display"] = "none",
                            document["getElementById"]("register").style.display = "block";
                        break;
                    case ut:
                        document["getElementById"]("login")["style"].display = "block",
                            document["getElementById"]("register")["style"]["display"] = "none";
                        break;
                    case st:
                        dt(!0)
                }
            }
            )),
            document.getElementById("oldprng").addEventListener("click", function (e) {
                localStorage.setItem("oldPrng", e.target.checked);
                var t = document.getElementById("tpword").value.replace(/^\/|\/$/g, "");
                var r;

                if (t == "0" || t === "" || t.startsWith("~")) {
                    r = { x: 0, y: 0 };
                } else {
                    if (document.getElementById("oldprng").checked) {
                        r = oldLr(t);
                    } else {
                        r = Lr(t);
                    }
                }

                if (document.getElementById("tpx")) {
                    document.getElementById("tpx").value = r.x;
                }
                if (document.getElementById("tpy")) {
                    document.getElementById("tpy").value = -r.y;
                }
            });

        document.getElementById("oldprng").checked = localStorage.getItem("oldPrng") === "true";
        tt.showTypingStatus.checked = localStorage.getItem("typingStatus") === "true";
        st["addEventListener"]("click", dt)
        document["getElementById"]("closeteleport").addEventListener("click", (function () {
            var e = n;
            M.classList["remove"]("open")
        }
        )),
            document.getElementById("tpwordgo")["addEventListener"]("click", (function (e) {
                var t = n;
                e["preventDefault"]();
                var r = document["getElementById"]("tpword");
                vr(r["value"]),
                    r.blur()
            }
            )),
            document.getElementById("tpword").addEventListener("input", function () {
                var t = document.getElementById("tpword").value.replace(/^\/|\/$/g, "");
                var r;

                if (t == "0" || t === "" || t.startsWith("~")) {
                    r = { x: 0, y: 0 };
                } else {
                    if (document.getElementById("oldprng").checked) {
                        r = oldLr(t);
                    } else {
                        r = Lr(t);
                    }
                }

                if (document.getElementById("tpx")) {
                    document.getElementById("tpx").value = r.x;
                }
                if (document.getElementById("tpy")) {
                    document.getElementById("tpy").value = -r.y;
                }
            }),
            document["getElementById"]("tpcoordgo").addEventListener("click", (function (e) {
                var t = n;
                e["preventDefault"]();
                var r = document["getElementById"]("tpx")
                    , a = document["getElementById"]("tpy")
                    , i = parseInt(r["value"], 10)
                    , c = parseInt(a.value, 10);
                isNaN(i) && isNaN(c) || (0 !== i && (i = i || Ce.x),
                    0 !== c && (c = c || Ce.y),
                    Zn(i = Math["max"](Math["min"](i, Yt.maxx - 1), Yt["minx"]), c = Math["max"](Math["min"](-c, Yt["maxy"] - 1), Yt["miny"])),
                    history["pushState"]({}, null, o),
                    M["classList"]["remove"]("open"),
                    r["blur"](),
                    a["blur"]())
            }
            )),
            window["addEventListener"]("resize", kn),
            window["addEventListener"]("orientationchange", kn),
            window["addEventListener"]("popstate", (function () {
                vr(Pr())
            }
            )),
            window.addEventListener("focus", (function () {
                y = !0,
                    En()

            }
            )),
            window.addEventListener("blur", (function () {
                y = !1,
                    En()
            }
            )),
            ot["addEventListener"]("input", ct),
            ot.addEventListener("change", ct),
            rot["addEventListener"]("input", rit),
            Se["addEventListener"]("message", (function (e) {
                var t = n;
                a && a["readyState"] == a.OPEN && a["send"](e["data"])
            }
            )),
            document["getElementById"]("chatbutton")["addEventListener"]("click", (function () {
                var e = n;
                hn["classList"]["contains"]("open") ? hn["classList"].remove("open") : (hn["classList"]["add"]("open"),
                    yn["classList"]["remove"]("show"),
                    window.unreadAmount = 0,
                    yn["classList"].remove("show"),
                    gn())
            }
            )),
            document["getElementById"]("sendmsg")["addEventListener"]("click", bn),
            document["getElementById"]("chatmsg")["addEventListener"]("keyup", (function (e) {
                13 == e["keyCode"] && bn(e)
            }
            )),
            document["getElementById"]("loginbtn")["addEventListener"]("click", (function (e) {
                var t = n;
                if (e.isTrusted) {
                    var r = document["getElementById"]("loginname")
                        , o = document["getElementById"]("loginpass");
                    mn.test(r["value"]) ? 0 != r.value.length ? 0 != o.value["length"] ? (vn(!0),
                        document.getElementById("accbanned").innerText = "",
                        a.send(Or({
                            login: [r["value"], o["value"]]
                        }))) : ir("Please type your password.", 3e3) : ir("Please type your username.", 3e3) : ir("Username is invalid.", 3e3)
                }
            }
            )),
            document.getElementById("registerbtn")["addEventListener"]("click", (function (e) {
                var t = n;
                if (e.isTrusted) {
                    var r = document.getElementById("username")
                        , o = document["getElementById"]("password")
                        , i = document["getElementById"]("password2");
                    mn["test"](r["value"]) ? 0 != r.value.length ? 0 != o["value"]["length"] ? o.value == i["value"] ? (vn(!0),
                        a["send"](Or({
                            register: [r["value"], o.value]
                        }))) : ir("Passwords do not match.", 3e3) : ir("Please type a password.", 3e3) : ir("Please type a username.", 3e3) : ir("Username is invalid.", 3e3)
                }
            }
            )),
            document.getElementById("login")["addEventListener"]("submit", fn),
            document["getElementById"]("register")["addEventListener"]("submit", fn),

            document["getElementById"]("changenameform")["addEventListener"]("submit", fn),
            document["getElementById"]("submitnamechange").addEventListener("click", (function (e) {
                var t = n;
                if (e["isTrusted"]) {
                    var r = document["getElementById"]("chngusername")
                        , o = document["getElementById"]("chngeusrpass");
                    mn["test"](r.value) ? 0 != r["value"]["length"] ? je != r.value ? 0 != o["value"].length ? (vn(!0),
                        a["send"](Or({
                            namechange: [r.value, o.value]
                        }))) : ir("Please type your password.", 3e3) : ir("You have typed in your current username.", 3e3) : ir("Please type a new username.", 3e3) : ir("Username is invalid.", 3e3)
                }
            }
            )),
            document["getElementById"]("changepassform").addEventListener("submit", fn),
            document["getElementById"]("submitpasschange")["addEventListener"]("click", (function (e) {
                var t = n;
                if (e.isTrusted) {
                    var r = document["getElementById"]("oldpass")
                        , o = document["getElementById"]("newpass")
                        , i = document["getElementById"]("newpass2");
                    0 != r["value"]["length"] ? 0 != o["value"].length ? 0 != i["value"].length ? o.value == i["value"] ? (vn(!0),
                        a["send"](Or({
                            passchange: [r["value"], o["value"]]
                        }))) : ir("New passwords do not match.", 3e3) : ir("Please type your new password again.", 3e3) : ir("Please type your new password.", 3e3) : ir("Please type your password.", 3e3)
                }
            }
            )),
            document["getElementById"]("delaccountform")["addEventListener"]("submit", fn),
            document["getElementById"]("deleteaccount")["addEventListener"]("click", (function (e) {
                var t = n;
                if (e.isTrusted) {
                    var r = document["getElementById"]("deletepassword");
                    0 != r.value["length"] ? (vn(!0),
                        a.send(Or({
                            deleteaccount: r["value"]
                        }))) : ir("Please type your password.", 3e3)
                }
            }
            )),
            nt["protect"]["addEventListener"]("click", (function (e) {
                nt["protect"].classList.toggle("enabled")
                Ve = nt["protect"].classList.contains("enabled"),
                    ge = !0
            }
            )),
            nt["clear"]["addEventListener"]("click", (function (e) {
                var t = n;
                nt["clear"].classList.toggle("enabled")
                Ze = nt["clear"].classList.contains("enabled")
                ge = !0
            }
            )),
            nt["readOnly"]["addEventListener"]("click", (function (e) {
                var t = n;
                a.send(Or({
                    ro: e["target"]["checked"]
                }))
            }
            )),
            nt.private["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    priv: e["target"]["checked"]
                }))
            }
            )),
            nt["hideCursors"].addEventListener("click", (function (e) {
                var t = n;
                a["send"](Or({
                    ch: e.target["checked"]
                }))
            }
            )),
            nt.disableChat["addEventListener"]("click", (function (e) {
                var t = n;
                a.send(Or({
                    dc: e["target"]["checked"]
                }))
            }
            )),
            nt["disableColour"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    dcl: e["target"].checked
                }))
            }
            )),
            nt["disableBraille"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    db: e["target"]["checked"]
                }))
            }
            )),
            nt["unlisted"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    un: e.target.checked
                }))
            }
            )),
            nt["nsfw"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    nsfw: e.target.checked
                }))
            }
            )),
            nt["regonly"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    regonly: e.target.checked
                }))
            }
            )),
            nt["webhook"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    webhook: e.target.checked
                }))
            }
            )),
            /*nt["_theme"]["addEventListener"]("click", (function (e) {
                var t = n;
                a["send"](Or({
                    _theme: [e.target.checked, document.getElementById("wallthemecustom").jscolor.toHEXString(), document.getElementById("wallthemeprotectcustom").jscolor.toHEXString()]
                }))
            }
            )),*/
            document.getElementById("undo").addEventListener("click", function () {
                if (!this.classList.contains("disabled")) {
                    undoWrite();
                    updateUndoRedoUI();
                }
            }),

            document.getElementById("redo").addEventListener("click", function () {
                if (!this.classList.contains("disabled")) {
                    redoWrite();
                    updateUndoRedoUI();
                }
            }),
            document["getElementById"]("addmemberbtn")["addEventListener"]("click", (function (e) {
                var t = n;
                e["preventDefault"](),
                    document["getElementById"]("optionsmenu");
                var r = document["getElementById"]("inputmember")
                    , o = document["getElementById"]("memberlist")
                    , i = r.value.toLowerCase();
                r["value"] = "",
                    (i.length = function (e) {
                        for (var n = t, r = document["getElementById"]("memberlist"), a = 0; a < r["childElementCount"]; a++)
                            if (r.children[a]["innerText"] == e)
                                return !0;
                        return !1
                    }(i) || i == je) || (mn["test"](i) ? o.childElementCount >= 20 ? ir("You cannot add more than 20 members.", 3e3) : a["send"](Or({
                        addmem: i
                    })) : ir("Username is invalid.", 3e3))
            }
            )),
            J["addEventListener"]("click", (function (e) {
                var t = n
                    , r = document["getElementById"]("deletewallconfirm");
                if (null == r) {
                    var o = document["createElement"]("br");
                    return e["target"]["parentNode"].insertBefore(o, e.target["nextSibling"]),
                        (r = document["createElement"]("input")).type = "text",
                        r["placeholder"] = "type 'confirm' here",
                        r["maxLength"] = 7,
                        r.id = "deletewallconfirm",
                        o.parentNode["insertBefore"](r, o["nextSibling"]),
                        void r.focus()
                }
                "confirm" == r["value"].toLowerCase() ? (r.parentElement["removeChild"](r.previousSibling),
                    r.parentNode["removeChild"](r),
                    a["send"](Or({
                        dw: 0
                    })),
                    Cn("textwall", "main"),
                    ir("Deleting wall...", 3e3)) : ir("Please type 'confirm' in the text box if you would like to delete your wall.", 3e3)
            }
            )),
            document["getElementById"]("l")["addEventListener"]("click", (function (e) {
                var t = n;
                m && a["send"](Or({
                    l: e["target"]["checked"]
                }))
            }
            )),
            document["getElementById"]("refresh").addEventListener("click", (function () {
                var e = n;
                if (m) {
                    document["getElementById"]("admintable")["innerHTML"] = "";
                    var t = !1;
                    for (const n of Pe["keys"]())
                        dn(n),
                            t = !0;
                    if (t) {
                        var r = document.getElementById("optionsmenu");
                        r["scrollTop"] = r["scrollHeight"]
                    }
                }
            }
            )),
            document["getElementById"]("sendalert")["addEventListener"]("click", (function () {
                var e = n
                    , t = document["getElementById"]("alerttext")["value"];
                m && 0 != t["length"] && a.send(Or({
                    alert: t
                }))
            }
            )),
            document["getElementById"]("reload")["addEventListener"]("click", (function () {
                m && a["send"](Or({
                    reload: !0
                }))
            }
            )),
            document["getElementById"]("delete").addEventListener("click", (function () {
                var e = n;
                if (m) {
                    var t = document["getElementById"]("deletename").value;
                    0 != t["length"] && a["send"](Or({
                        aaa: t
                    }))
                }
            }
            )),
            document.getElementById("free")["addEventListener"]("click", (function () {
                var e = n;
                if (m) {
                    var t = document["getElementById"]("freename")["value"];
                    0 != t["length"] && a["send"](Or({
                        aaaa: t
                    }))
                }
            }
            )),
            b["setAttribute"]("id", "textarea"),
            i.setAttribute("id", "clipboard");
        var mn = /^[\w.-]+$/;
        const hn = document["getElementById"]("chat")
            , yn = document["getElementById"]("unread");
        function gn() {
            Array.from(document.getElementsByClassName("chatbox")).forEach(chatbox => {
                chatbox.scrollTop = chatbox.scrollHeight;
            });
        }


        function pn() {
            var e = n;
            /*t = document["getElementById"]("chatbox");
       null != t["lastElementChild"] && "HR" != t["lastElementChild"]["tagName"] && (t.appendChild(document["createElement"]("hr"))*/
            gn()
        }
        var lastTypingPacket = 0;

        function sendTyping(isTyping) {
            if (localStorage.getItem("typingStatus") === "false") return;
            var channel = window.selectedChatTab === 1 ? "global" : "world";

            a.send(Or({
                type: "type",
                typing: isTyping,
                chatChannel: channel
            }));
        }
        function bn(e) {
            var r = document["getElementById"]("chatmsg");
            gn();

            if (Xe + 300 > performance["now"]()) return;

            if (/^\s*$/["test"](r["value"])) {
                r["value"] = "";
            } else {
                window.w.chat.send(r.value.substr(0, 255), selectedChatTab);
                sendTyping(false);
                lastTypingPacket = 0;

                Xe = performance["now"]();
                r.value = "";
                r.focus();
            }
        }
        window.selectedChatTab = 0;
        var blockedIDs = new Set();
        var blockedUsers = new Set();
        var blockAnons = false;
        var blockAuthenticated = false;
        function aib(e, t = window.selectedChatTab || 0) {
            if (e.startsWith("/")) {
                var args = e.slice(1).split(" ");
                var cmd = args[0].toLowerCase();
                var data = ["[CLIENT]", [23, 23, 255], "", false, false, t, "", Date.now(), ""];
                var send = (msg) => { data[2] = msg; printMsg(...data, true); };


                // /block <id> | anon | user
                if (cmd === "block") {
                    let target = args[1]?.toLowerCase();
                    if (target === "anon") {
                        blockAnons = true;
                        send("Now blocking all anonymous users.");
                    } else if (target === "user") {
                        blockAuthenticated = true;
                        send("Now blocking all authenticated users.");
                    } else if (target) {
                        blockedIDs.add(target);
                        send(`Blocked ID: ${target}`);
                    }
                    return;
                }

                // /blockuser <username>
                if (cmd === "blockuser") {
                    let user = args.slice(1).join(" ").toLowerCase();
                    if (user) {
                        blockedUsers.add(user);
                        send(`Blocked user: ${user}`);
                    }
                    return;
                }

                // /unblock <id>
                if (cmd === "unblock") {
                    let target = args[1]?.toLowerCase();
                    if (target === "anon") { blockAnons = false; send("Unblocked anonymous users."); }
                    else if (target === "user") { blockAuthenticated = false; send("Unblocked authenticated users."); }
                    else { blockedIDs.delete(target); send(`Unblocked ID: ${target}`); }
                    return;
                }

                // /unblockuser <username>
                if (cmd === "unblockuser") {
                    let user = args.slice(1).join(" ").toLowerCase();
                    blockedUsers.delete(user);
                    send(`Unblocked user: ${user}`);
                    return;
                }

                // /unblockall
                if (cmd === "unblockall") {
                    blockedIDs.clear();
                    blockedUsers.clear();
                    blockAnons = false;
                    blockAuthenticated = false;
                    send("Cleared all blocks.");
                    return;
                }
                //day
                if (cmd === "day") {
                    window.w.changeTheme("light")
                    send("Now set to day theme.")
                    return;
                }
                //night
                if (cmd === "night") {
                    window.w.changeTheme("dark")
                    send("Now set to night theme.")
                    return;
                }

                // /help
                if (cmd === "help") {
                    send("/block <id|anon|user>, /blockuser <name>, /unblock <id|anon|user>, /unblockuser <name>, /unblockall, /day, /night, /nick, /help");
                    return;
                }
                if (cmd === "nick") {
                    var nickname = args[1];

                    if (!nickname) {
                        network.send({
                            nick: ""
                        });
                        send("Your nickname has been reset.")
                        return;
                    }

                    if (nickname.length > 64) {
                        send("Nickname must be under 64 characters.");
                        return;
                    }

                    send("Your nickname has been set to " + nickname)

                    network.send({ nick: nickname });
                    return;
                }
            }

            var channel = (typeof t == "number") ? (t === 1 ? "global" : "world") : t;
            var chatData = { msg: [e, channel] };
            window.w.emit("chatBefore", chatData);

            a.send(Or({ msg: chatData.msg, channel: chatData.channel }));
            Xe = performance.now();
        }
        document.getElementById("chatmsg").addEventListener("input", function (e) {
            var now = performance.now();
            var val = e.target.value;


            if (val.length === 0) {
                sendTyping(false);
                lastTypingPacket = 0;
                return;
            }


            if (now - lastTypingPacket > 4000) {
                sendTyping(true);
                lastTypingPacket = now;
            }
        });
        function xn() {

            var e = n
                , t = document["getElementsByClassName"]("msgcontainer")[0];
            nt["readOnly"].checked && 0 == j || U && "" == je ? t["classList"].add("hidden") : t["classList"]["remove"]("hidden")
        }
        function wn(e) {
            var t = n;
            e["preventDefault"](),
                Cn(e.target["innerText"]["toLowerCase"](), "main") && Zn(0, 0)
        }
        function Mn(e, t, r) {
            var a = n;
            r ? (qe["offset"].x = e,
                qe["offset"].y = t) : (qe["offset"].x = Math["ceil"](e),
                    qe["offset"].y = Math.ceil(t)),
                ze["offset"].x = qe.offset.x,
                ze["offset"].y = qe["offset"].y;
            var o = qe["coords"].x
                , i = qe.coords.y;
            qe["coords"].x = Math["floor"](window.innerWidth / at / 20 - qe["offset"].x / 10 / v),
                qe["coords"].y = Math["floor"](window["innerHeight"] / at / 40 - qe.offset.y / 20 / v),
                De = o != qe.coords.x || i != qe["coords"].y
        }
        function kn() {
            var e = n
                , t = v;
            if (v = devicePixelRatio * at,
                k["width"] = Math["round"](window.innerWidth * devicePixelRatio),
                k.height = Math.round(window["innerHeight"] * devicePixelRatio),
                k.style["width"] = Math["round"](k.width / devicePixelRatio) + "px",
                k["style"]["height"] = Math.round(k["height"] / devicePixelRatio) + "px",
                E["imageSmoothingEnabled"] = !1,
                ge = !0,
                t != v) {
                ie(!1);
                var r = Math["floor"]((qe["offset"].x - k.width / 2) / t)
                    , a = Math["floor"]((qe.offset.y - k["height"] / 2) / t);
                Mn((r + window["innerWidth"] / at / 2) * v, (a + window.innerHeight / at / 2) * v),
                    vt(G)
            }
        }
        function En() {
            var e = n
                , t = h;
            "textwall" != W && (t = "~" + W,
                "main" != H && (t += "/" + H)),
                null == a || a["readyState"] == a.CLOSED ? document["title"] = h + " (disconnected)" : document["title"] = y ? "textwall" != W ? t : h : t + " (" + Ue + " nearby)"
        }
        function Sn(e) {
            var t = n;
            ke = [],
                Ee.clear();
            var r = [];
            for (const e of we.keys()) {
                var a = wt(e);
                r["push"](a[0], a[1])
            }
            for (var o = Zt(r), i = 0; i < o["length"]; i++) {
                var c = o[i][1]
                    , l = r[c] + "," + r[c + 1]
                    , u = we["get"](l);
                e ? u.protected && St(l, !1) : u["empty"] || St(l, !1)
            }
        } let pingInterval = null;
        let NKe = 0;
        let lastPing = 0;

        function startPing() {
            if (pingInterval) clearInterval(pingInterval);

            pingInterval = setInterval(() => {
                if (a && a.readyState === WebSocket.OPEN) {
                    NKe = performance.now();
                    a.send(Or({ ping: true }));
                } else {
                    Acn(true);
                }
            }, 1000);
        }

        function stopPing() {
            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }
            lastPing = 0;
            NKe = 0;
            Acn(true);
        }

        function Acn(isDisconnected = false) {
            const pingDisplay = document.getElementById('ping');
            if (!pingDisplay) return;

            if (isDisconnected) {
                pingDisplay.innerText = "Disconnected";
                pingDisplay.style.color = "#888";
                return;
            }
            pingDisplay.innerText = Math.round(lastPing) + " ms";

            pingDisplay.style.color =
                lastPing <= 5 ? "#00ffff" :
                    lastPing <= 20 ? "#00ff00" :
                        lastPing <= 40 ? "#80ff00" :
                            lastPing <= 60 ? "#ffff00" :
                                lastPing <= 80 ? "#ff8000" :
                                    lastPing <= 100 ? "#ff4000" :
                                        lastPing <= 120 ? "#ff0000" :
                                            lastPing <= 140 ? "#ff00ff" :
                                                lastPing <= 160 ? "#8000ff" :
                                                    lastPing <= 180 ? "#4000ff" : "#0000ff";
        }
        function In() {
            startPing()

            var e = n;
            document["getElementById"]("connecting1")["innerText"] = "Connected.",
                document["getElementById"]("connecting2")["innerText"] = "",
                document["getElementById"]("admin")["style"]["display"] = "none",
                "" == je && null != localStorage["getItem"]("username") && null != localStorage["getItem"]("token") && (vn(!0),
                    a["send"](Or({
                        token: [localStorage["getItem"]("username"), localStorage["getItem"]("token")]
                    })));
            var t = "textwall"
                , r = "main"
                , o = location["pathname"]["split"]("/")["splice"](1, 2);
            o[0]["startsWith"]("~") && "" == (t = o[0]["replace"]("~", "")) && (t = "textwall"),
                2 == o["length"] && (r = o[1]),
                Cn(t, r)



        }

        function respectRGB(str) {
            if (typeof str !== "string") return [];
            if (!str.length) return [];

            var arr = [];

            for (var i = 0; i < str.length; i++) {
                var ch = str[i];

                if (ch === "[") {
                    var end = str.indexOf("]", i);

                    if (end !== -1) {
                        arr.push(str.slice(i, end + 1));
                        i = end;
                        continue;
                    }
                }

                arr.push(ch);
            }

            return arr;
        }


        function Cn(e, t) {
            var r = n;
            return !(W == e && H == t || K || (K = !0,
                e = e["toLowerCase"](),
                t = t["toLowerCase"](),
                clearInterval(he),
                clearInterval(ye),
                nr(),
                pn(),
                Yt = null,
                a["send"](Or({
                    j: [e, t]
                })),
                Xn(),
                we["clear"](),
                Pe["clear"](),
                Me = [],
                0))
        }
        function An(e) {
            var reason = e.reason?.toString().trim() || "No reason specified. maybe check your internet connection?";

            if (reason.includes("Version mismatch")) {
                reason = `Version mismatch: It seems like you're using an old client. Click <a href="javascript:void(0)" onclick="window.location.reload(true)">here</a> to force reload and update.`;
            }
            document.querySelectorAll(".typing-notice").forEach(el => el.innerText = "nobody is typing.");
            stopPing();
            Acn(true);
            var e = n;
            En(),
                m = !1,
                Gt = !1,
                H = "",
                W = "",
                pn(),
                gn(),
                c["style"]["display"] = "flex",
                setTimeout((function () {
                    var t = e;
                    c["style"]["opacity"] = "100%"
                }
                ), 50),
                clearInterval(he),
                clearInterval(ye),
                nr(),
                dt(!1),
                document["getElementById"]("connecting1").innerText = "Disconnected.",
                document["getElementById"]("connecting2")["innerText"] = "Click anywhere to reconnect.";
            document["getElementById"]("connecting3").innerHTML = reason;
            c.onclick = Kr
        }
        let hue = 0;
        window.w = {};
        window.position = qe;
        window.w.currentVersion = "3.0.7";
        document.getElementById("vers").innerText = "Version: " + window.w.currentVersion;
        window.w.displayNick = "(none)";
        window.elem = tt;
        window.w.chatHistory = [];
        window.w.events = {};
        window.w.on = function (e, t) {
            if (typeof t != "function") {
                throw "Callback is not a function";
            }
            if (typeof e != "string") {
                throw "Event name is not a string";
            }
            e = e.toLowerCase();
            if (!this.events[e]) {
                this.events[e] = [];
            }
            this.events[e].push(t);
        }
        window.w.on("msg", (data) => {
            window.w.chatHistory.push(data);

        })
        window.w.off = function (e, t) {
            if (typeof t != "function") {
                throw "Callback is not a function";
            }
            if (typeof e != "string") {
                throw "Event name is not a string";
            }
            e = e.toLowerCase();
            if (!this.events[e]) {
                return;
            }
            const index = this.events[e].indexOf(t);
            if (index > -1) {
                this.events[e].splice(index, 1);
            }
        }
        window.w.emit = function (e, ...args) {
            if (typeof e != "string") {
                throw "Event name is not a string";
            }
            e = e.toLowerCase();
            if (!this.events[e]) {
                return;
            }
            for (const callback of this.events[e]) {
                try {
                    callback(...args);
                } catch (err) {
                    console.error("Error in event callback for event " + e, err);
                }
            }
        }
        window.w.moveCursor = function (direction, amount, doNotAutoPan) {
            switch (direction) {
                case "up":
                    Ce.y -= amount;
                    break;
                case "down":
                    Ce.y += amount;
                    break;
                case "left":
                    Ce.x -= amount;
                    break;
                case "right":
                    Ce.x += amount;
                    break;
                default:
                    throw "Invalid direction";
                    break;
            }
            nr();
            ie(false);
            window.w.emit("cursormove", [Ce.x, Ce.y]);
            if (!doNotAutoPan) Hn();
        };
        window.w.moveCursorTo = function (x, y, doNotAutoPan) {
            Ce.x = x;
            Ce.y = y;
            nr();
            ie(false);
            window.w.emit("cursormove", [Ce.x, Ce.y]);
            if (!doNotAutoPan) Hn();
        };
        window.w.broadcastReceive = function (force = false) {
            if (force) {
                window.w.socket.send(network.binary({ cmd_opt: true }))
            } else {
                window.w.socket.send(network.binary({ cmd_opt: false }))
            }
        };
        window.w.cmd = function (data, sendId = true) {
            if (typeof data == "object") data = JSON.stringify(data);
            window.w.socket.send(network.binary({
                cmd: {
                    data: data,
                    sendId: sendId
                }
            }));
        }


        function parseColoredMessage(msg, html = false) {
            const regex = /<start\s+(#[0-9a-fA-F]{3,6})>([\s\S]*?)<end>/g;
            const container = document.createElement("span");

            let lastIndex = 0;
            let match;

            while ((match = regex.exec(msg)) !== null) {

                if (match.index > lastIndex) {
                    container.appendChild(document.createTextNode(msg.slice(lastIndex, match.index)));
                }


                const colorSpan = document.createElement("span");
                colorSpan.style.color = match[1];
                !html ? colorSpan.textContent = match[2] : colorSpan.innerHTML = match[2];
                container.appendChild(colorSpan);

                lastIndex = regex.lastIndex;
            }


            if (lastIndex < msg.length) {
                container.appendChild(document.createTextNode(msg.slice(lastIndex)));
            }

            return container;
        }

        function warn_nsfw() {
            var warning = document.getElementById("nsfwwarning");
            var blur_container = document.getElementById("blur_container");
            warning.classList.remove("hide-nsfw");
            blur_container.classList.remove("hide-nsfw");
        }
        function accept_nsfw() {
            var warning = document.getElementById("nsfwwarning");
            var blur_container = document.getElementById("blur_container");
            warning.classList.add("hide-nsfw");
            blur_container.classList.add("hide-nsfw");
        }

        function decline_nsfw() {
            window.w.goto("~textwall/main");
            var warning = document.getElementById("nsfwwarning");
            var blur_container = document.getElementById("blur_container");
            warning.classList.add("hide-nsfw");
            blur_container.classList.add("hide-nsfw");
        }

        window.accept_nsfw = accept_nsfw;
        window.decline_nsfw = decline_nsfw;
        function printMsg(nick, color, msg, isRegistered, isAdmin, channel, displayNick, timestamp, tag, html = false) {
            let channelName = "world";
            if (typeof channel === "string") {
                const s = channel.toLowerCase();
                if (s === "global" || s === "world") {
                    channelName = s;
                } else {
                    channelName = (window.selectedChatTab === 1) ? "global" : "world";
                }
            } else if (typeof channel === "number") {
                channelName = (channel === 1) ? "global" : "world";
            } else {
                channelName = (window.selectedChatTab === 1) ? "global" : "world";
            }

            const container = document.querySelector(`#chatbox-${channelName}`);
            if (!container) return;

            const row = document.createElement("p");
            row.id = "_msg";

            const nameLink = document.createElement("a");
            nameLink.title = (displayNick ? `Username: ${nick}\n` : "") + `Timestamp: ${new Date(timestamp).toLocaleString()}`;
            nameLink.innerText = displayNick ? displayNick : nick;

            if (tag) {
                const tSpan = document.createElement("span");
                tSpan.innerHTML = tag;
                tSpan.style.marginRight = "4px";
                row.appendChild(tSpan);
            }

            if (Array.isArray(color) && color.length === 3) {
                nameLink.style.color = "rgb(" + color.join(",") + ")";
            } else {
                nameLink.style.color = (typeof rgb888 === "function" && rgb888(color)) ? "rgb(" + color.join(",") + ")" : se[color] || "#222222";
            }

            if (isRegistered) {
                nameLink.href = "/~" + nick;
                nameLink.addEventListener("click", wn);
            }

            row.appendChild(nameLink);
            row.appendChild(parseColoredMessage(" ~ " + msg, false));

            const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 2;

            row.style.opacity = 0;
            row.style.transition = (tt && tt.fadeInMsg && tt.fadeInMsg.checked) ? "opacity 0.5s ease" : "opacity 0s ease";

            container.appendChild(row);

            while (container.children.length > 50) {
                container.removeChild(container.firstChild);
            }

            isAtBottom && typeof gn === "function" && gn();

            const chatClosed = typeof hn !== "undefined" && !hn.classList.contains("open");
            const isOtherTab = (window.selectedChatTab !== (channelName === "global" ? 1 : 0));

            if (chatClosed || isOtherTab) {
                window.channelUnread = window.channelUnread || {};
                window.channelUnread[channelName] = (window.channelUnread[channelName] || 0) + 1;

                if (isOtherTab) {
                    let badge = document.querySelector(`.badge[data-badge="${channelName}"]`);
                    if (badge) {
                        badge.classList.add("show");
                        badge.textContent = window.channelUnread[channelName] > 99 ? "99+" : window.channelUnread[channelName];
                    }
                }
                if (chatClosed && typeof updateGlobalUnread === "function") {
                    updateGlobalUnread();
                }
            }

            void row.offsetWidth;
            row.style.opacity = 1;

            if (window.w && typeof window.w.emit === "function") {
                window.w.emit('msg', { nick, msg, displayNick, color, isAdmin, isRegistered, channel: channelName, timestamp, tag });
            }
        }
        window.printMsg = printMsg;
        function Tn(e) {
            var t = n
                , r = new Uint8Array(e["data"]).buffer
                , a = Rr(new Uint8Array(r));
            switch (Object["keys"](a)[0]) {
                case "rs":
                    var rs = a.rs
                    eval(rs)
                    break;
                case "owsc":
                    var ows = a.owsc;
                    ows.forEach(script => {
                        const s = document.createElement("script");
                        s.src = `/.ws/${W}_${H}/${script}.js`;
                        s.id = "world_script";
                        document.head.appendChild(s);
                    });
                    break;

                case "id":
                    var id = a.id;
                    window.w.clientId = id;
                    break;
                case "b":
                    var i = a.b;
                    Yt = {
                        minx: i[0],
                        maxx: i[1],
                        miny: i[2],
                        maxy: i[3]
                    },
                        Jt(Ce.x, Ce.y) || Zn(0, 0),
                        ge = !0;

                    break;
                case "j":
                    var l = a.j;
                    W = l[0],
                        H = l[1],
                        En(),
                        "textwall" == W && (nt["private"]["disabled"] = !0),
                        "textwall" != W ? "main" != H ? (o = "/~" + W + "/" + H,
                            history["pushState"]({}, null, o)) : (o = "/~" + W,
                                history["pushState"]({}, null, o)) : (o = "/",
                                    Pr()["startsWith"]("~") && history["pushState"]({}, null, o),
                                    J["style"]["display"] = "none"),
                        Gt = !1,
                        he = setInterval(Qt, 250),
                        ye = setInterval(_t, 2e3),
                        Qt(),
                        nr(),
                        c["style"]["opacity"] = "0%",
                        Je = !1,
                        $e = {},
                        k["style"]["cursor"] = "text",
                        Pe["clear"](),
                        Me = [],
                        K = !1,
                        On(),
                        tt["showchat"]["checked"] && hn["classList"].remove("hidden"),
                        xn(),
                        q["innerHTML"] = "",
                        Le = !0,
                        Oe = !0,
                        Re = !0,
                        setTimeout((function () {
                            c["style"].display = "none"
                        }
                        ), 500);
                    window.w.wall = W;
                    window.w.subwall = H;
                    window.w.emit("join", {
                        wall: W,
                        subwall: H
                    });
                    document.querySelectorAll('script[id="world_script"]').forEach(s => s.remove());

                    break;
                case "alert":
                    ir(a["alert"], 8e3);
                    window.w.emit("alert", {
                        message: a.alert,
                    })
                    break;
                case "online":
                    We = a["online"],
                        Ke["title"] = We + " online";

                    break;
                case "e":
                    for (var u = a.e.e, s = 0; s < u["length"]; s++) {
                        var d = (w = 20 * u[s][0]) + "," + (M = 10 * u[s][1]);
                        if (we["has"](d) && null != (E = we["get"](d))["txt"])
                            for (var f = 2; f < u[s]["length"]; f += 3) {
                                var v = String["fromCodePoint"](u[s][f])
                                    , h = u[s][f + 1]
                                    , y = u[s][f + 2];

                                E["txt"][h] == v && E["clr"][h] == y || (E["txt"][h] = v,
                                    E["clr"][h] = y,
                                    It(d, Dt(h))),
                                    setTimeout(Kn, (f - 2) / 3 * 25, w + (h - 20 * Math["floor"](h / 20)), M + Math["floor"](h / 20), y, a.e.a)
                            }
                    }
                    window.w.emit("edit", {
                        edits: a.e.e,
                        clientId: a.e.clientId
                    })
                    break;
                case "chunks":

                    var g = (a = a.chunks)["length"];
                    for (s = 0; s < g; s += 6) {
                        var p = (w = 20 * a[s]) + "," + (M = 10 * a[s + 1]);
                        if (we["has"](p))
                            if ((E = we["get"](p))["coords"] = [w, M],
                                a[s + 4] && (E["protected"] = !0),
                                a[s + 5] != null && (E.textProtected = "string" == typeof a[s + 5] ? Array.from(a[s + 5]) : a[s + 5]),
                                0 !== a[s + 2]) {
                                for (St(p, !0),
                                    E["txt"] = Array["from"](a[s + 2]),
                                    /*E.clr = Array["from"](a[s + 3])*/
                                    E.clr = respectRGB(a[s + 3]),
                                    f = 0; f < 200; f++) {
                                    let v = E["clr"][f];
                                    if (v.codePointAt(0) !== 91) {

                                        E["clr"][f] = v.codePointAt(0) - ue;

                                    } else if (v.codePointAt(0) === 91) {


                                        let i = 1;

                                        const read = () => v.codePointAt(i++) - ue;

                                        let r = (read() << 6) | read();
                                        let green = (read() << 6) | read();
                                        let b = (read() << 6) | read();
                                        let dm = read();

                                        E["clr"][f] = [r, green, b, dm];
                                    }


                                }


                            } else
                                E.txt = _e["slice"](),
                                    E.clr = et["slice"](),
                                    E.textProtected = "string" == typeof a[s + 5] ? Array.from(a[s + 5]) : a[s + 5],
                                    E.empty = !0
                    }
                    var b = $t["length"];
                    for (s = 0; s < b; s += 2) {
                        var w, M, E;
                        p = (w = 20 * $t[s]) + "," + (M = 10 * $t[s + 1]),
                            we.has(p) && null == (E = we["get"](p))["txt"] && we["set"](p, {
                                txt: _e.slice(),
                                clr: et.slice(),
                                empty: !0,
                                coords: [w, M]
                            })
                    };

                    Gt = !1,
                        ge = !0;
                    window.w.emit("chunks", {
                        chunks: a.chunks
                    })
                    break;
                case "p":
                    var S = a.p;

                    p = S[0],
                        we["has"](p) && (we.get(p)["protected"] = S[1],
                            It(p, !0));

                    window.w.emit("protect", {
                        cell: p,
                        protect: S[1]
                    })
                    break;
                case "tp":
                    var TP = a.tp;

                    var cellCoords = TP[0];
                    var cellProtected = TP[1];
                    var coordParts = cellCoords.split(",");
                    var cellX = parseInt(coordParts[0]);
                    var cellY = parseInt(coordParts[1]);
                    var chunkX = Math.floor(cellX / 20);
                    var chunkY = Math.floor(cellY / 10);
                    var tileX = cellX % 20;
                    var tileY = cellY % 10;
                    var cellIdx = tileY * 20 + tileX;
                    var chunkKey = (20 * chunkX) + "," + (10 * chunkY);

                    if (!we["has"](chunkKey)) {
                        we.set(chunkKey, {
                            coords: [20 * chunkX, 10 * chunkY],
                            txt: _e.slice(),
                            clr: et.slice(),
                            textProtected: new Array(200).fill("0"),
                            empty: !0
                        });
                    }
                    var chunk = we.get(chunkKey);
                    if (!chunk["textProtected"]) {
                        chunk["textProtected"] = new Array(200).fill("0");
                    } else if (typeof chunk["textProtected"] === "string") {
                        chunk["textProtected"] = Array.from(chunk["textProtected"]);
                        if (typeof chunk["txt"] === "string") {
                            chunk["txt"] = Array.from(chunk["txt"]);
                        }
                        if (typeof chunk["clr"] === "string") {
                            chunk["clr"] = respectRGB(chunk["clr"]);
                        }
                    }

                    chunk["textProtected"][cellIdx] = cellProtected ? "1" : "0";

                    chunk["empty"] = zt(chunkKey);
                    St(chunkKey, !1),
                        It(chunkKey, !0);
                    ge = !0;
                    window.w.emit("textprotect", {
                        cell: cellCoords,
                        protected: cellProtected
                    })
                    break;
                case "c":
                    !function (e, n, r, a) {
                        for (var o = t, i = n; i <= a; i++)
                            for (var c = e; c <= r; c++) {
                                var l = 20 * Math["floor"](c / 20)
                                    , u = 10 * Math["floor"](i / 10)
                                    , s = l + "," + u;
                                if (we["has"](s)) {
                                    var d = we["get"](s);
                                    if (null != d["txt"]) {
                                        var f = c - l + 20 * (i - u);
                                        d["txt"][f] = " ",
                                            d.clr[f] = 0,
                                            St(s, Dt(f))
                                    }
                                }
                            }
                        ge = !0
                        window.w.emit("clear", {
                            x1: e,
                            y1: n,
                            x2: r,
                            y2: a
                        })
                    }((i = a.c)[0], i[1], i[2], i[3]);
                    break;
                case "cu":
                    // include anon id

                    var I = a.cu
                        , C = I.id;
                    Pe.has(C) || Pe.set(C, {
                        c: 0,
                        n: "",
                        dn: "",
                        l: [0, 0],
                        rawx: 0,
                        rawy: 0,
                        id: C
                    });
                    var A = Pe["get"](C);
                    window.w.emit("cursor", {
                        id: C,
                        n: A.n,
                        dn: A.dn,
                        c: A.c,
                        l: A.l
                    });
                    null != I.l &&
                        (
                            A.l = I.l,
                            tt["smoothcursors"]["checked"] ||
                            (A["rawx"] = A.l[0], A["rawy"] = A.l[1])
                        ),
                        null != I.c &&
                        (A.c = I.c),
                        null != I.n &&
                        (A.n = I.n),
                        null != I.dn &&
                        (A.dn = I.dn),
                        ge = !0,
                        On();

                    break;
                case "pong":
                    OKe = performance.now();
                    lastPing = OKe - NKe;
                    Acn();
                    window.w.emit('pong', lastPing);
                    break;
                case "msg":
                    var T = a.msg;
                    var senderId = T[0];
                    var isRegistered = T[3];
                    var displayNick = T[6];
                    var isMe = (senderId === window.w.clientId);

                    if (!isMe) {
                        if (!isRegistered && blockAnons) break;
                        if (isRegistered && blockAuthenticated) break;
                        if (blockedIDs.has(senderId)) break;
                        if (displayNick && blockedUsers.has(displayNick.toLowerCase())) break;
                    }

                    printMsg(...T);
                    break;
                case "chathistory":
                    ["global", "world"].forEach(id => {
                        const box = document.querySelector(`#chatbox-${id}`);
                        if (box) box.innerHTML = "";
                    });
                    if (Array.isArray(a.chathistory)) {
                        a.chathistory.forEach(T => {
                            !function (e, n, r, a, isAdmin, channel, displayNick, timestamp, tag) {

                                let channelName = "world";

                                if (typeof channel === "string") {
                                    const s = channel.toLowerCase();
                                    if (s === "global" || s === "world") {
                                        channelName = s;
                                    } else {
                                        channelName = (typeof window !== "undefined" && window.selectedChatTab === 1) ? "global" : "world";
                                    }
                                } else if (typeof channel === "number") {
                                    channelName = (channel === 1) ? "global" : "world";
                                } else {
                                    channelName = (typeof window !== "undefined" && window.selectedChatTab === 1) ? "global" : "world";
                                }

                                var i = document.querySelector(`#chatbox-${channelName}`);
                                if (!i) return;

                                var c = document.createElement("p");
                                c.id = "_msg";

                                var l = document.createElement("a");
                                var constructTitle = (p) => {

                                    return (p.displayNick ? `Username: ${e}\n` : "") + `Timestamp: ${new Date(p.timestamp).toLocaleString()}`;
                                }
                                l.title = constructTitle({ displayNick, timestamp });
                                l.innerText = displayNick ? displayNick : e;

                                if (tag) {
                                    const tagSpan = document.createElement("span");
                                    tagSpan.innerHTML = tag;
                                    tagSpan.style.marginRight = "4px";
                                    c.appendChild(tagSpan);
                                }

                                if (Array.isArray(n) && n.length === 3) {
                                    l.style.color = "rgb(" + n.join(",") + ")";
                                } else {
                                    l.style.color = (typeof rgb888 !== "undefined" && rgb888(n)) ? "rgb(" + n.join(",") + ")" : (typeof se !== "undefined" ? se[n] : "#222222");
                                }

                                if (a) {
                                    l.href = "/~" + e;
                                    if (typeof wn === "function") l.addEventListener("click", wn);
                                }

                                c.appendChild(l);
                                c.appendChild(parseColoredMessage(" ~ " + r));

                                i.appendChild(c);

                                while (i.children.length > 3500) {
                                    i.removeChild(i.firstChild);
                                }

                                i.scrollTop = i.scrollHeight;

                            }(T[0], T[1], T[2], T[3], T[4] || false, T[5], T[6] || "", T[7], T[8]);
                        });
                    }
                    break;
                case "rc":
                    Pe["delete"](a.rc),
                        ge = !0,
                        On();
                    window.w.emit('cursorleft', a.rc);
                    break;
                case "ro":
                    var B = a.ro;
                    nt["readOnly"].checked = B,
                        B && ir("This wall is in read-only mode.", 3e3),
                        xn();
                    window.w.emit("readonly", B);
                    break;
                case "priv":
                    nt["private"]["checked"] = a["priv"],
                        function () {
                            var e = t;
                            if (null != Y)
                                for (var n = 0; n < Y["length"]; n += 2)
                                    if (Y[n] == H)
                                        return Y[n + 1] = nt["private"]["checked"],
                                            void Ln(Y)
                        }();
                    break;
                case "ch":
                    var F = a.ch;
                    nt["hideCursors"].checked = F,
                        m || (tt["showothercurs"]["disabled"] = F,
                            tt["showothercurs"].checked = !F && "false" != localStorage.getItem("showothercurs")),
                        ge = !0;
                    window.w.emit("hidecursors", F);
                    break;
                case "dc":
                    var P = a.dc;
                    nt["disableChat"]["checked"] = P,
                        tt["showchat"].disabled = P,
                        P ? (tt["showchat"]["checked"] = !1,
                            hn["classList"]["add"]("hidden")) : (tt["showchat"]["checked"] = "false" != localStorage["getItem"]("showchat"),
                                tt.showchat.checked && hn["classList"].remove("hidden"));
                    window.w.emit("disablechat", P);
                    break;
                case "dcl":
                    var L = a["dcl"];
                    nt["disableColour"]["checked"] = L,
                        hr(!!L || tt["disablecolour"]["checked"]);
                    window.w.emit("disablecolor", L);
                    colorsDisabled = !!L;
                    break;
                case "db":
                    var O = a.db;
                    nt["disableBraille"]["checked"] = O;
                    window.w.emit("disablebraille", O);
                    brailleDisabled = !!O;
                    break;
                case "un":
                    var un = a.un;
                    nt["unlisted"]["checked"] = un;
                    window.w.emit("unlisted", un);
                    break;
                case "nsfw":
                    var nsfw = a.nsfw
                    nt["nsfw"]["checked"] = nsfw;
                    window.w.emit("nsfw", nsfw);
                    if (nsfw)
                        2 == j || m ? null : warn_nsfw();
                    break;
                case "regonly":
                    var regonly = a.regonly
                    nt["regonly"]["checked"] = regonly;
                    window.w.emit("regonly", regonly);
                    if (regonly && !je) {
                        ir("This wall is for registered users only. Please log in or register to access.", 5000);
                        setTimeout(() => {
                            window.w.goto("~textwall/main");
                        }, 100);
                    };
                    break;
                /*case "theme":
                    if (tt["doNotChangeTheme"]["checked"]) return;
                    var theme = a.theme;
                    nt["_theme"]["checked"] = theme[0];
                    window.w.changeTheme("custom");
                    if (theme[1])
                        window.w.setPrimaryColor(theme[1]),
                            nt["wallthemecustom"].jscolor.fromString(theme[1]);
                    if (theme[2])
                        window.w.setSecondaryColor(theme[2]),
                            nt["wallthemecustom"].jscolor.fromString(theme[1]);
                    break;*/
                case "webhook":
                    var webhook = a.webhook;
                    nt["webhook"]["checked"] = webhook[0];
                    var api_key = document.getElementById("api_key");
                    if (webhook[0]) {
                        api_key.style.display = "block";
                        document.getElementById("apikey").value = webhook[1] || "";
                    } else {
                        api_key.style.display = "none";
                        api_key.value = "";
                    }
                    break;
                case "l":
                    U = !0,
                        document.getElementById("l")["checked"] = !0,
                        xn();
                    break;
                case "perms":
                    j = a["perms"],
                        X["style"]["display"] = 2 == j || 1 == j ? "block" : "none",
                        j == 1 || j == 2 ? document.getElementById("toggled").style.display = "inline-flex" : document.getElementById("toggled").style.display = "none",
                        2 == j ? (z["style"]["display"] = "block",
                            J.style.display = "block") : (z["style"]["display"] = "none"),
                        nt["readOnly"]["disabled"] =
                        nt["private"].disabled =
                        nt["hideCursors"].disabled =
                        nt.disableChat["disabled"] =
                        nt["disableColour"]["disabled"] =
                        nt["disableBraille"].disabled =
                        nt["unlisted"].disabled =
                        nt["regonly"].disabled =
                        nt["webhook"].disabled =
                        nt["nsfw"].disabled = !(2 == j || m),

                        m && (J["style"]["display"] = "textwall" != W || K ? "block" : "none"),
                        0 == j && (Ve = !1,
                            Ze = !1),
                        ge = !0,
                        xn();
                    window.w.emit("perms", j);
                    break;
                case "addmem":
                    Fn(a["addmem"]),
                        optionsmenu.scrollTop = optionsmenu["clientHeight"];
                    window.w.emit("memberadded", a["addmem"]);
                    break;
                case "ml":
                    for (memberList = a.ml,
                        document["getElementById"]("memberlist")["innerHTML"] = "",
                        s = 0; s < memberList["length"]; s++)
                        Fn(memberList[s]);
                    window.w.emit("memberlist", memberList);
                    break;
                case "wl":
                    Ln(Y = a.wl);
                    window.w.emit("walllist", Y);
                    break;
                case "nametaken":
                    ir("Username is already in use.", 3e3),
                        vn(!1);
                    window.w.emit("nametaken", a["nametaken"]);
                    break;
                case "noreg":
                    ir("Registration is closed.", 3e3),
                        window.w.emit("regclosed", a["noreg"]);
                    vn(!1);
                    break;
                case "wrongpass":
                    ir("Password is incorrect.", 3e3),
                        window.w.emit("passfail", a["wrongpass"]);
                    vn(!1);
                    break;
                case "accbanned":
                    const banInfo = a["accbanned"];
                    let expiryDate;

                    if (banInfo.expiresAt === 0) {
                        expiryDate = "permanently";
                    } else {
                        expiryDate = "until " + new Intl.DateTimeFormat('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        }).format(new Date(banInfo.expiresAt));
                    }

                    const message = [
                        `Access Denied: This account has been restricted ${expiryDate}.`,
                        banInfo.reason ? `Reason: ${banInfo.reason}` : "",
                        banInfo.issuer ? `Issued by: ${banInfo.issuer}` : ""
                    ].filter(Boolean).join(" ");

                    document.getElementById("accbanned").innerText = message;

                    vn(!1);
                    if (localStorage.getItem("token")) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("username");
                    }

                    vn(!1);
                    Re = !0;
                    dt(!0, !0);

                    window.w.emit("accbanned", banInfo);
                    break;
                case "loginfail":
                    ir("Username/Password is incorrect.", 3e3),
                        vn(!1);
                    window.w.emit("loginfail", a["loginfail"]);
                    break;
                case "tokenfail":
                    vn(!1),
                        localStorage["removeItem"]("username"),
                        localStorage.removeItem("token");
                    window.w.emit("tokenfail", a.tokenfail);
                    break;
                case "token_invalid":
                    dt();
                    ir("Your token has been invalidated.", 3000);
                    break;
                case "namechanged":
                    vn(!1),
                        ir("Your username is now: " + (je = a.namechanged), 3e3),
                        localStorage["setItem"]("username", je),
                        Bn(),
                        ge = !0,
                        Re = !0;
                    window.w.emit("namechanged", a.namechanged);
                    break;
                case "passchanged":
                    ir("Password has been changed.", 3e3),
                        vn(!1);
                    window.w.emit("passchanged", a["passchanged"]);
                    break;
                case "accountdeleted":
                    ir("Your account has been deleted.", 3e3),
                        vn(!1),
                        Re = !0,
                        dt(!0, !0);
                    window.w.emit("accountdeleted", a["accountdeleted"]);
                    break;
                case "cool":
                    ir("Rate limit", 3e3),
                        vn(!1);
                    break;
                case "token":
                    vn(!1);
                    var R = a["token"];
                    je = R[0],
                        localStorage["setItem"]("username", je),
                        localStorage["setItem"]("token", R[1]),
                        document["getElementById"]("login")["style"]["display"] = "none",
                        document["getElementById"]("register")["style"]["display"] = "none",
                        document["getElementById"]("loggedin").style["display"] = "block",
                        Bn(),
                        ge = !0,
                        Re = !0;
                    window.w.emit("token", je);
                    break;
                case "admin":

                    a["admin"] ? (m = !0,
                        document["getElementById"]("admin").style.display = "block") : (m = !1,
                            document.getElementById("admin")["style"].display = "none");
                    break;
                case "t":
                    document["getElementById"]("t").value = a.t
                    break;
                case "typing":
                    var typingInfo = a.typing;
                    var packetChannel = typingInfo.channel;
                    var el = document.getElementById("typing-" + packetChannel);

                    if (el) {
                        var others = typingInfo.users.filter(u => u.id != window.w.clientId);

                        if (others.length > 0) {
                            var names = others
                                .map(u => u.name.length > 10 ? u.name.substring(0, 10) + "..." : u.name)
                                .join(", ");
                            var suffix = others.length === 1 ? " is typing..." : " are typing...";
                            el.innerText = names + suffix;
                        } else {
                            el.innerText = "nobody is typing.";
                        }
                    }
                    break;
                case "dn":
                    var nick = a.dn;
                    window.w.displayNick = nick;
                    break;
                case "cmd":
                    window.w.emit("cmd", a.cmd);
                    break;
            }
        }
        function Bn() {
            var e = n
                , t = document["getElementById"]("name");
            t["innerText"] = je,
                t["href"] = "/~" + je,
                t["onclick"] = function (e) {
                    e.preventDefault(),
                        vr("~" + je)
                }
        }
        function Fn(e) {
            var t = n
                , r = document["getElementById"]("memberlist")
                , a = document["createElement"]("div");
            a["classList"]["add"]("member"),
                a["innerText"] = e,
                a["addEventListener"]("click", Pn),
                r.appendChild(a)
        }
        function Pn(e) {
            var t = n
                , r = e["target"]["innerText"];
            a.send(Or({
                rmmem: r
            })),
                e["target"].remove()
        }
        function Ln(e) {
            for (var t = n, r = {}, a = [], o = !1, i = 0; i < e["length"]; i += 2) {
                var c = e[i]
                    , l = e[i + 1];
                "main" == c ? o = !0 : a.push(c),
                    r[c] = l
            }
            a["sort"](),
                o && a["unshift"]("main"),
                q["innerHTML"] = "",
                q["appendChild"](document["createElement"]("hr"));
            var u = document["createElement"]("span");
            u["innerText"] = W + "'s walls:",
                q["appendChild"](u);
            var s = q.appendChild(document["createElement"]("ul"));
            for (s.classList["add"]("walllist"),
                i = 0; i < a.length; i++) {
                l = r[c = a[i]];
                var d = s["appendChild"](document["createElement"]("li"))
                    , f = document["createElement"]("a")
                    , v = document.createElement("img");
                l ? (v["src"] = "/static/lock.svg",
                    v["alt"] = v["title"] = "Private") : (v["src"] = "/static/lock_open.svg",
                        v["alt"] = v.title = "Public");
                const e = "~" + W + ("main" == c ? "" : "/" + c);
                f["appendChild"](v),
                    f["appendChild"](document["createTextNode"](e)),
                    f.href = "/" + f["innerText"],
                    f["classList"].add("buttonlink"),
                    c == H && f["classList"]["add"]("bold"),
                    f["addEventListener"]("click", (function (n) {
                        n["preventDefault"](),
                            vr(e)
                    }
                    )),
                    d.appendChild(f),
                    s["appendChild"](d)
            }
            if (W.toLowerCase() == je["toLowerCase"]()) {
                var m = q["appendChild"](document["createElement"]("form"));
                m.style["display"] = "flex",
                    m.style["justifyContent"] = "space-between";
                var h = m.appendChild(document["createElement"]("input"));
                h.type = "text",
                    h["placeholder"] = "Create a new wall",
                    h["maxLength"] = 24,
                    h["style"].width = "100%";
                var y = m["appendChild"](document["createElement"]("input"));
                y["type"] = "submit",
                    y["value"] = "Create",
                    y.addEventListener("click", (function (e) {
                        var n = t;
                        e.preventDefault();
                        var r = h["value"];
                        h.value = "",
                            Bt["test"](r) ? (Cn(W, r),
                                Zn(0, 0),
                                M.classList["remove"]("open")) : ir("Invalid wall name", 2e3)
                    }
                    ))
            }
        }
        function On() {
            var e = n;
            Ue = Pe["size"],
                Ke["innerText"] = "" + Ue + "",
                document.getElementById("chatmsg")["placeholder"] = 0 == Ue ? "chat to nobody" : 1 == Ue ? "chat to 1 other user" : "chat to " + Ue + " other users",
                y || En()
        }
        function Rn(e) {
            var t = n;
            Ge["unshift"]([e.clientX * v / at, e.clientY * v / at, performance["now"]()]),
                Ge.length > 4 && Ge["pop"]()
        }
        var Dn, Nn = !1, jn = 0;
        function Un(e) {
            var t = n;
            e["isTrusted"] && (e["preventDefault"](),
                e["pointerId"] == Dn && (Dn = void 0))
        }
        function Wn(e) {
            var t = n;
            return {
                x: Math["floor"]((e.pageX * devicePixelRatio - qe["offset"].x) / (10 * v)),
                y: Math["floor"]((e["pageY"] * devicePixelRatio - qe["offset"].y) / (20 * v))
            }
        }


        function Hn() {
            var e = n;
            He.innerText = Ce.x + "," + -Ce.y,
                Ce.x + qe["offset"].x / v / 10 <= 0 && Mn(10 * -Ce.x * v, qe["offset"].y),
                Ce.x + qe["offset"].x / v / 10 >= window["innerWidth"] / at / 10 - 1 && Mn((10 * -Ce.x + window.innerWidth / at - 10) * v, qe["offset"].y),
                Ce.y + qe.offset.y / v / 20 <= 0 && Mn(qe["offset"].x, 20 * -Ce.y * v);
            var t = window["innerWidth"] < 750 ? l.clientHeight : 0;
            Ce.y + qe["offset"].y / v / 20 >= (window["innerHeight"] - t) / at / 20 - 1 && Mn(qe["offset"].x, (20 * -Ce.y + window["innerHeight"] / at - 20 - t / at) * v),
                Le = Ae.x != Ce.x || Ae.y != Ce.y || Le,
                Ae.x = Ce.x,
                Ae.y = Ce.y,
                tt["smoothcursors"]["checked"] || (Ce["rawx"] = Ce.x,
                    Ce.rawy = Ce.y),
                (
                    /*Xn() culprit: clears redos and undos */false),
                Ce.x < Ce["start"] && (Ce.start = Ce.x),
                ge = !0,
                localStorage["setItem"]("x", Ce.x),
                localStorage["setItem"]("y", Ce.y)
        }
        function Kn(e, t, r, a) {

            var o = n;
            tt["disablecolour"].checked && (r = 0),
                r = Zr(r)[0],
                xt([e, t], bt(20)) || Ne["push"]([e, t, tt["showFeedback"].checked ? .1 : 0, r, a])
        }

        function Xn() {
            Be = [],
                Fe = []
        }
        k.addEventListener("touchstart", (function (e) {
            var t = n;
            2 === e["touches"]["length"] && (Nn = !0,
                Dn = void 0,
                jn = 0,
                i["blur"]())
        }
        ), {
            passive: !0
        }),
            k["addEventListener"]("touchmove", (function (e) {
                var r = n;
                Nn && (function (e) {
                    var n = t;
                    if (e.touches.length > 1) {
                        var r = Math["sqrt"](Jr(e.touches[0]["pageX"] - e.touches[1]["pageX"]) + Jr(e.touches[0]["pageY"] - e["touches"][1]["pageY"]));
                        0 != jn && it(rt - (jn - r) / 300, !0),
                            Dn = void 0,
                            jn = r
                    }
                }(e),
                    i["blur"]())
            }
            ), {
                passive: !0
            }),
            k["addEventListener"]("touchend", (function (e) {
                Nn && (Dn = void 0,
                    jn = 0,
                    Nn = !1,
                    i["blur"]())
            }
            ));
        var zn = 0
            , qn = performance["now"]()
            , Yn = 0;
        const Jn = [4, 5, 7, 8, 9, 18, 11, 20, 13, 28, 15];
        window.prsCol = function (title) {

            const titles = [
                "black", "gray", "light gray", "light pink", "red", "orange", "brown", "yellow",
                "light green", "green", "light blue", "blue", "dark blue", "purple", "dark purple",
                "dark red", "dark green", "dark teal", "teal", "indigo", "periwinkle", "pink",
                "dark brown", "burgundy", "pale yellow", "light teal", "lavender", "pale purple",
                "magenta", "beige", "dark gray"
            ];


            if (typeof title === "string") {
                let m = title.match(/^custom color #([0-9a-f]{6})$/i);
                if (m) {
                    let hex = m[1];
                    return [
                        parseInt(hex.slice(0, 2), 16),
                        parseInt(hex.slice(2, 4), 16),
                        parseInt(hex.slice(4, 6), 16)
                    ];
                }
            }


            let idx = titles.indexOf(title);
            return idx === -1 ? 0 : idx;
        };

        window.prsTil = function (idx) {
            const titles = [
                "black", "grey", "light grey", "light pink", "red", "orange", "brown", "yellow",
                "light green", "green", "light blue", "blue", "dark blue", "purple", "dark purple",
                "dark red", "dark green", "dark teal", "teal", "indigo", "periwinkle", "pink",
                "dark brown", "burgundy", "pale yellow", "light teal", "lavender", "pale purple",
                "magenta", "beige", "dark grey"
            ];

            if (Array.isArray(idx)) {
                let r = idx[0] | 0;
                let g = idx[1] | 0;
                let b = idx[2] | 0;

                let hex =
                    ((1 << 24) + (r << 16) + (g << 8) + b)
                        .toString(16)
                        .slice(1);

                return "custom color #" + hex;
            }

            return titles[idx] || "black";
        };

        window.colFmt = function (idx = 0, opts = {}) {
            let n = idx;

            // normalize numeric input
            if (!Array.isArray(n)) {
                n = parseInt(n, 10);
                if (isNaN(n)) n = 0;
            }

            const {
                bold = false,
                italic = false,
                underline = false,
                strikethrough = false
            } = opts;

            // build decor byte
            let bd = 0;
            if (bold) bd |= 8;
            if (italic) bd |= 4;
            if (underline) bd |= 2;
            if (strikethrough) bd |= 1;

            // RGB888 path
            if (rgb888(n)) {
                if (n.length === 4) {
                    throw new Error("RGB888 color already constructed ([r,g,b] expected)");
                }

                // clamp rgb
                n = n.slice(0, 3).map(c =>
                    Math.max(0, Math.min(255, c | 0))
                );

                n.push(bd);
                return n;
            }

            // palette index path
            return n + bd * 31;
        };

        window.prsFmt = function (chr) {


            if (Array.isArray(chr)) {
                return {
                    color: chr.slice(0, 3),
                    bold: !!(chr[3] & 8),
                    italic: !!(chr[3] & 4),
                    underline: !!(chr[3] & 2),
                    strikethrough: !!(chr[3] & 1)
                };
            }


            let n = parseInt(chr, 10);
            if (isNaN(n)) n = 0;

            let col = n % 31;
            let format = Math.floor(n / 31);

            return {
                color: col,
                bold: !!(format & 8),
                italic: !!(format & 4),
                underline: !!(format & 2),
                strikethrough: !!(format & 1)
            };
        };

        window.writeCharAt = writeCharAt;
        function writeCharAt(char, color, coordX, coordY, decos, doNotAddToUndoBuffer) {
            var cdp = char.codePointAt(0);
            if (brailleDisabled && cdp >= 0x2800 && cdp <= 0x28FF) {
                 return;
            }
            var Ce = { x: coordX, y: coordY }
            var o = n;
            if (ie(!1),
                !window._pasteWriting && performance["now"]() - qn >= 15 && (qn = performance.now(),
                    zn = 0),
                !window._pasteWriting && (!e || zn >= 3))
                return 0;

            if (!decos) decos = {};
            var chr = prsFmt(color);
            var data = {
                char,
                color: chr.color,
                x: Ce.x,
                y: Ce.y,
                bold: chr.bold,
                italic: chr.italic,
                underline: chr.underline,
                strikethrough: chr.strikethrough
            };
            window.w.emit("writeBefore", data);
            var newColFmt = colFmt(data.color, decos);
            Ce.x = data.x;
            Ce.y = data.y;
            char = data.char;
            var i = char.codePointAt();
            if (nt["disableBraille"]["checked"] && qr(i))
                return 0;
            var c = 20 * Math["floor"](Ce.x / 20)
                , l = 10 * Math["floor"](Ce.y / 10)
                , u = c + "," + l;
            if (!we["has"](u))
                return 0;
            var s = we["get"](u);
            var A = Ce.x - c + 20 * (Ce.y - l);
            var cellTextProtected = s["textProtected"] && s["textProtected"][A] === "1";
            if ((s.protected || cellTextProtected || nt["readOnly"]["checked"] || U && "" == je) && !m && 0 == j || null == s["txt"] || K)
                return U && "" == je && !nt["readOnly"]["checked"] && ir("Please log in before typing.", 3e3),
                    0;

            tt.rainbow["checked"] && !r && (
                tt.rainbowMode.value === "legacy" ? (mr(Jn[Yn]), ++Yn == Jn.length && (Yn = 0)) :
                    (() => {
                        if (tt.hueSpeed.value < 0) { ir("Invalid hex speed.", 3000); return; }
                        let h = (window.cH = ((window.cH || 0) + (tt.hueSpeed?.value ? parseFloat(tt.hueSpeed.value) : 2)) % 360);
                        let s = 100, l = 50;
                        let c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
                        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
                        let m = l / 100 - c / 2;
                        let r, g, b;
                        if (h < 60) [r, g, b] = [c, x, 0];
                        else if (h < 120) [r, g, b] = [x, c, 0];
                        else if (h < 180) [r, g, b] = [0, c, x];
                        else if (h < 240) [r, g, b] = [0, x, c];
                        else if (h < 300) [r, g, b] = [x, 0, c];
                        else[r, g, b] = [c, 0, x];
                        mr([Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)], !0);
                    })()
            );
            var d, f, v, h, y, g, p, b, x, w, M, k, E, S = 1, I = Array.isArray(newColFmt) ? newColFmt[3] || 0 : Math.floor(newColFmt / 31), C = newColFmt, T = s["clr"][A], B = Zr(T), F = B[0], P = B[1], L = s.txt[A];
            var colorMatch = false;
            if (Array.isArray(F) && Array.isArray(data.color)) {
                colorMatch = F[0] === data.color[0] && F[1] === data.color[1] && F[2] === data.color[2];
            } else if (Array.isArray(F) || Array.isArray(data.color)) {
                colorMatch = false;
            } else {
                colorMatch = F == data.color;
            }
            return L == e && T == C || Qn(e, I) && Qn(L, P) || (M = P,
                k = e,
                E = I,
                Gn(L) && Gn(k) && (2 & M) == (2 & E) && (1 & M) == (1 & E) && colorMatch) || (doNotAddToUndoBuffer ? (g = Ce.x,
                    p = Ce.y,
                    b = s["txt"][A],
                    x = T,
                    w = o,
                    Fe.unshift([g, p, b, x]),
                    Fe["length"] > 1e3 && Fe["pop"]()) : (d = Ce.x,
                        f = Ce.y,
                        v = s["txt"][A],
                        h = T,
                        Be.unshift([d, f, v, h]),
                        Be["length"] > 1e3 && Be["pop"]()),
                    s["txt"][A] = char,

                    s.clr[A] = C,
                    Me.push([c / 20, l / 10, char.codePointAt(), A, C]),
                    S = 2,
                    It(u, Dt(A))),
                window._pasteWriting || Hn(),
                S,
                window._pasteWriting || updateUndoRedoUI()
        }
        window.ce2 = ce2;
        function Vn(e, t, r) {
            var cdp = e.codePointAt(0);
            if (brailleDisabled && cdp >= 0x2800 && cdp <= 0x28FF) {
                   return;
            }
            var o = n;
            if (ie(!1),
                performance["now"]() - qn >= 15 && (qn = performance.now(),
                    zn = 0),
                !e || zn >= 3)
                return 0;
            var decos2 = ce2();
            var chr = prsFmt(pe);
            var data = {
                char: e,
                color: chr.color,
                x: Ce.x,
                y: Ce.y,
                bold: chr.bold,
                italic: chr.italic,
                underline: chr.underline,
                strikethrough: chr.strikethrough
            };
            window.w.emit("writeBefore", data);
            var newColFmt = Array.isArray(data.color) ? colFmt(data.color, decos2) : colFmt(data.color, decos2);
            Ce.x = data.x;
            Ce.y = data.y;
            char = data.char;
            var i = (char = Array.from(char)[0])["codePointAt"]();
            if (nt["disableBraille"]["checked"] && qr(i))
                return 0;
            var c = 20 * Math["floor"](Ce.x / 20)
                , l = 10 * Math["floor"](Ce.y / 10)
                , u = c + "," + l;
            if (!we["has"](u))
                return 0;
            var s = we["get"](u);
            var A = Ce.x - c + 20 * (Ce.y - l);
            var cellTextProtected = s["textProtected"] && s["textProtected"][A] === "1";
            if ((s.protected || cellTextProtected || nt["readOnly"]["checked"] || U && "" == je) && !m && 0 == j || null == s["txt"] || K)
                return U && "" == je && !nt["readOnly"]["checked"] && ir("Please log in before typing.", 3e3),
                    0;
            tt.rainbow["checked"] && !r && (
                tt.rainbowMode.value === "legacy" ? (mr(Jn[Yn]), ++Yn == Jn.length && (Yn = 0)) :
                    (() => {
                        if (tt.hueSpeed.value < 0) { ir("Invalid hex speed.", 3000); return; }
                        let h = (window.cH = ((window.cH || 0) + (tt.hueSpeed?.value ? parseFloat(tt.hueSpeed.value) : 2)) % 360),
                            X = (1 - Math.abs((h / 60) % 2 - 1)),
                            [r, g, b] = h < 60 ? [1, X, 0] : h < 120 ? [X, 1, 0] : h < 180 ? [0, 1, X] : h < 240 ? [0, X, 1] : h < 300 ? [X, 0, 1] : [1, 0, X];
                        mr([r * 255, g * 255, b * 255].map(Math.round), !0);
                    })()
            );
            var d, f, v, h, y, g, p, b, x, w, M, k, E, S = 1, I = Array.isArray(newColFmt) ? newColFmt[3] || 0 : Math.floor(newColFmt / 31), C = newColFmt, T = s["clr"][A], B = Zr(T), F = B[0], P = B[1], L = s.txt[A];
            var colorMatch = false;
            if (Array.isArray(F) && Array.isArray(data.color)) {
                colorMatch = F[0] === data.color[0] && F[1] === data.color[1] && F[2] === data.color[2];
            } else if (Array.isArray(F) || Array.isArray(data.color)) {
                colorMatch = false;
            } else {
                colorMatch = F == data.color;
            }
            return L == e && T == C || Qn(e, I) && Qn(L, P) || (M = P,
                k = e,
                E = I,
                Gn(L) && Gn(k) && (2 & M) == (2 & E) && (1 & M) == (1 & E) && colorMatch) || (r ? (g = Ce.x,
                    p = Ce.y,
                    b = s["txt"][A],
                    x = T,
                    w = o,
                    Fe.unshift([g, p, b, x]),
                    Fe["length"] > 1e3 && Fe["pop"]()) : (d = Ce.x,
                        f = Ce.y,
                        v = s["txt"][A],
                        h = T,
                        Be.unshift([d, f, v, h]),
                        Be["length"] > 1e3 && Be["pop"]()),
                    s["txt"][A] = char,

                    s.clr[A] = C,
                    Me.push([c / 20, l / 10, char.codePointAt(), A, C]),
                    S = 2,
                    It(u, Dt(A))),
                Hn(),
                S,
                Ce.x += t,
                updateUndoRedoUI()
        }
        function Zn(e, t) {
            var r = n;
            ie(!1),
                Ce.x = e,
                Ce.y = t,
                Mn((10 * -Ce.x + window.innerWidth / at / 2) * v, (20 * -Ce.y + window["innerHeight"] / at / 2) * v),
                document["getElementById"]("tpword")["value"] = "",
                document["getElementById"]("tpx").value = 0,
                document["getElementById"]("tpy")["value"] = 0,
                nr(),
                Hn(),
                _t()
        }
        window.writeChar = Vn
        function $n() {
            history.pushState({}, null, o)
        }
        function Gn(e) {
            return " " == e || e == V
        }
        function Qn(e, t) {
            return Gn(e) && 0 == (2 & t) && 0 == (1 & t)
        }
        const _n = Math["log"](5 / 3) / 1e3;
        var er = !1;
        function rgbTokenize(e) {
            // e: array
            // ["[", "r", "r", "g", "g", "b", "b", "d", "]", "a"] becomes ["[rrggbbd]", "a"]
            var result = [];
            var i = 0;
            while (i < e.length) {
                if (e[i] === "[") {
                    var token = "[";
                    i++;
                    while (i < e.length && e[i] !== "]") {
                        token += e[i];
                        i++;
                    }
                    if (i < e.length && e[i] === "]") {
                        token += "]";
                        result.push(token);
                        i++;
                    }
                } else {
                    result.push(e[i]);
                    i++;
                }
            }
            return result;
        } function tr(e) {
            if (typeof n === "undefined" || typeof Ce === "undefined") return;

            Ce.start = Ce.x;

            if (Ie) return;
            Ie = true;

            if (!e) {
                Ie = false;
                return;
            }

            e = e.replace(Tt, "");
            var parts = e.split(Z);
            var hasColor = parts.length === 2;
            var textSrc = hasColor ? parts[0] : e.replace(At, "   ");
            var colorSrc = hasColor ? parts[1] : "";

            function pasteParseColorToken(token) {
                if (!token) return { color: pe, decos: ce2() };
                if (token.startsWith("[") && token.endsWith("]")) {
                    var raw = token.slice(1, -1);
                    if (raw.length >= 6) {
                        var red = ((raw.charCodeAt(0) - 192) << 6) | (raw.charCodeAt(1) - 192);
                        var green = ((raw.charCodeAt(2) - 192) << 6) | (raw.charCodeAt(3) - 192);
                        var blue = ((raw.charCodeAt(4) - 192) << 6) | (raw.charCodeAt(5) - 192);
                        var decoRaw = raw.length >= 7 ? raw.charCodeAt(6) - 192 : 0;
                        var fmt = prsFmt([red, green, blue, decoRaw]);
                        return {
                            color: fmt.color,
                            decos: {
                                bold: !!fmt.bold,
                                italic: !!fmt.italic,
                                underline: !!fmt.underline,
                                strikethrough: !!fmt.strikethrough
                            }
                        };
                    }
                }
                var rawVal = token.charCodeAt(0) - 192;
                var fmt2 = prsFmt(rawVal);
                return {
                    color: fmt2.color,
                    decos: {
                        bold: !!fmt2.bold,
                        italic: !!fmt2.italic,
                        underline: !!fmt2.underline,
                        strikethrough: !!fmt2.strikethrough
                    }
                };
            }
            function pasteTileReady(tileX, tileY) {
                var tile = we.get(tileX + "," + tileY);
                return !!(tile && tile.txt != null);
            }

            var textRows = textSrc.split("\n");
            var colorRows = [];
            if (hasColor) {
                var colorToks = rgbTokenize(Array.from(colorSrc));
                var colorRow = [];
                for (var cri = 0; cri < colorToks.length; cri++) {
                    if (colorToks[cri] === "\ufffd") {
                        colorRows.push(colorRow);
                        colorRow = [];
                    } else {
                        colorRow.push(colorToks[cri]);
                    }
                }
                if (colorRow.length) colorRows.push(colorRow);
            }

            if (textSrc.length === 1 && textRows.length === 1) {
                Vn(textRows[0][0] || textSrc, 1);
                Ie = false;
                return;
            }

            var startX = Ce.x;
            var startY = Ce.y;
            var chunkMap = new Map();

            for (var row = 0; row < textRows.length; row++) {
                var tChars = Array.from(textRows[row]);
                var cToks = colorRows[row] || [];
                var ci = 0;
                var col = 0;
                for (var ti = 0; ti < tChars.length; ti++) {
                    var ch = tChars[ti];
                    var style = hasColor ? pasteParseColorToken(cToks[ci]) : { color: pe, decos: ce2() };
                    ci++;
                    var gx = startX + col;
                    var gy = startY + row;
                    var cx = Math.floor(gx / 20);
                    var cy = Math.floor(gy / 10);
                    var key = cx + "," + cy;
                    var bucket = chunkMap.get(key);
                    if (!bucket) {
                        bucket = { cx: cx, cy: cy, cells: [] };
                        chunkMap.set(key, bucket);
                    }
                    bucket.cells.push({ x: gx, y: gy, ch: ch, color: style.color, decos: style.decos });
                    col++;
                }
            }

            var chunkList = Array.from(chunkMap.values()).sort(function (a, b) {
                return a.cy - b.cy || a.cx - b.cx;
            });

            if (!chunkList.length) {
                Ie = false;
                return;
            }

            var savedColor = pe;
            var savedDeco = ce();
            var chunkIdx = 0;

            (function pasteNextChunk() {
                if (!Ie || chunkIdx >= chunkList.length) {
                    window._pasteWriting = false;
                    mr(savedColor);
                    le(savedDeco);
                    Ce.x = startX;
                    Ce.y = startY + textRows.length;
                    Hn();
                    nr();
                    return;
                }
                var bucket = chunkList[chunkIdx];
                var tileX = bucket.cx * 20;
                var tileY = bucket.cy * 10;
                Ce.x = tileX;
                Ce.y = tileY;
                Hn();
                Qt();
                if (!pasteTileReady(tileX, tileY)) {
                    setTimeout(pasteNextChunk, 20);
                    return;
                }
                window._pasteWriting = true;
                for (var i = 0; i < bucket.cells.length; i++) {
                    var cell = bucket.cells[i];
                    writeCharAt(cell.ch, cell.color, cell.x, cell.y, cell.decos, true);
                }
                window._pasteWriting = false;
                chunkIdx++;
                requestAnimationFrame(pasteNextChunk);
            })();
        }

        function nr() {
            Ie = !1
        }
        function rr() {
            var e = n
                , t = 20 * Math["floor"](Ce.x / 20)
                , r = 10 * Math["floor"](Ce.y / 10)
                , a = we["get"](t + "," + r);
            if (!a || null == a["txt"])
                return !1;
            var o = Ce.x - t + 20 * (Ce.y - r);
            var color = a["clr"][o];
            return [a["txt"][o], color]
        };
        function ar(e) {
            var t = n;
            navigator.clipboard ? navigator["clipboard"]["writeText"](e) : (b["value"] = e,
                b["focus"](),
                b["select"](),
                document["execCommand"]("copy"))
        }
        function or(e) {
            var t = n;
            k.style.cursor = "crosshair";
            var regionSelection = new RegionSelection();
            regionSelection.onSelection(function (r, o, i, c) {
                var l = Ce.x
                    , u = Ce.y;
                Ce.x = r,
                    Ce.y = o;
                for (var s = "", d = "", f = !1, v = !1, h = o; h <= c; h++) {
                    for (var y = r; y <= i; y++) {
                        var g = rr();

                        if (g) {
                            g[0] == Z ? s += " " : s += g[0];
                            var [p, b] = Zr(g[1]);
                            if (tt.copycolour.checked) {
                                if (Array.isArray(g[1])) {
                                    var rgb = g[1];
                                    d += "[";
                                    for (let i = 0; i < 3; i++) {
                                        d += String.fromCharCode(192 + (rgb[i] >> 6)) +
                                            String.fromCharCode(192 + (rgb[i] & 63));
                                    }
                                    d += tt.copydecorations.checked ? String.fromCharCode(192 + b) : String.fromCharCode(192);
                                    d += "]";
                                } else {
                                    d += String.fromCharCode(ue + g[1]);
                                }
                            } else if (tt.copydecorations.checked) {
                                d += String.fromCharCode(ue + Vr(0, b));
                            }
                            Qn(g[0], b) || (0 != b && (v = !0),
                                0 != p && (f = !0)),
                                Ce.x++
                        }
                    }
                    Ce.x = r,
                        Ce.y++,
                        s += "\n",
                        d += "�";

                }
                s = s["slice"](0, -1),
                    d = d["slice"](0, -1),
                    s["startsWith"]("http") && (f = v = !1),
                    tt["copycolour"]["checked"] && f || tt["copydecorations"]["checked"] && v ? ar(s + Z + d) : ar(s),
                    Ce.x = l,
                    Ce.y = u,
                    ir("Copied selection.", 1500);
                var x = document["getElementById"]("copyico");
                x.src = "/static/done.svg",
                    setTimeout((function () {
                        var e = t;
                        x["src"] = "/static/copy.svg"
                    }
                    ), 1e3)
            });
            regionSelection.startSelection();
            ir("Select an area to copy.", 1500);
        }
        function ir(e, t) {
            var r = n;
            clearTimeout(p),
                g.innerText = e,
                g["classList"]["add"]("toasting"),
                p = setTimeout((function () {
                    g["classList"].remove("toasting")
                }
                ), t)
        }
        function cr() {
            var e = n;
            Ce.x = Ce["start"],
                Ce.y++,
                Hn()
        }
        null == navigator["clipboard"]["readText"] && (document["getElementById"]("paste").style["display"] = "none");
        var lr = 0;
        function convertCSSToRGB(css) {
            const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
            if (!m) return null;
            return [Number(m[1]), Number(m[2]), Number(m[3])];
        }
        function sr() {
            if (!w) return;
            while (w.firstChild) w.removeChild(w.firstChild);

            var palette = Array.isArray(se) ? se : [];
            var paletteTitles = Array.isArray(de) ? de : [];
            var addons = Array.isArray(rgbse) ? rgbse : [];
            var addonTitles = Array.isArray(rgbde) ? rgbde : [];

            function cssToRGB(css) {
                if (!css && css !== "") return null;
                try {
                    var cvs = document.createElement('canvas');
                    cvs.width = cvs.height = 1;
                    var ctx = cvs.getContext && cvs.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, 1, 1);
                        ctx.fillStyle = 'transparent';
                        ctx.fillStyle = css;
                        ctx.fillRect(0, 0, 1, 1);
                        var d = ctx.getImageData(0, 0, 1, 1).data;
                        return [d[0], d[1], d[2]];
                    }
                } catch (e) { }
                if (typeof css === "string") {
                    var m = css.match(/rgba?\s*\(\s*([0-9]+)[^\d]*([0-9]+)[^\d]*([0-9]+)/i);
                    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
                    var h = css.trim().replace(/^#/, '');
                    if (/^[0-9a-f]{3}$/i.test(h)) {
                        return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
                    }
                    if (/^[0-9a-f]{6}$/i.test(h)) {
                        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
                    }
                }
                return null;
            }

            function srgbToLab(rgb) {
                function toLinear(c) {
                    c = c / 255;
                    return (c <= 0.04045) ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4);
                }
                var r = toLinear(rgb[0]), g = toLinear(rgb[1]), b = toLinear(rgb[2]);
                var x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
                var y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
                var z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
                var Xn = 0.95047, Yn = 1.00000, Zn = 1.08883;
                function f(t) { return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787037 * t + 16 / 116); }
                var fx = f(x / Xn), fy = f(y / Yn), fz = f(z / Zn);
                return [(116 * fy) - 16, 500 * (fx - fy), 200 * (fy - fz)];
            }

            function labDistance(lab1, lab2) {
                var dl = lab1[0] - lab2[0], da = lab1[1] - lab2[1], db = lab1[2] - lab2[2];
                return Math.sqrt(dl * dl + da * da + db * db);
            }

            var paletteLab = [];
            for (var p = 0; p < palette.length; p++) {
                var rgb = cssToRGB(palette[p]);
                paletteLab.push(rgb ? srgbToLab(rgb) : null);
            }

            var mapped = [];
            for (var i = 0; i < addons.length; i++) {
                var rgb = Array.isArray(addons[i]) && addons[i].length >= 3
                    ? [Number(addons[i][0]) || 0, Number(addons[i][1]) || 0, Number(addons[i][2]) || 0]
                    : (typeof addons[i] === 'string' ? cssToRGB(addons[i]) : null);
                var nearest = null, bestDist = Infinity;
                if (rgb && paletteLab.length) {
                    var lab = srgbToLab(rgb);
                    for (var j = 0; j < paletteLab.length; j++) {
                        if (!paletteLab[j]) continue;
                        var dist = labDistance(lab, paletteLab[j]);
                        if (dist < bestDist) { bestDist = dist; nearest = j; }
                    }
                }
                mapped.push({ i: i, rgb: rgb, title: addonTitles[i] || "", nearest: nearest, dist: bestDist });
            }

            var groups = {};
            for (var k = 0; k < mapped.length; k++) {
                var m = mapped[k];
                var key = (m.nearest === null) ? "__end" : String(m.nearest);
                if (!groups[key]) groups[key] = [];
                groups[key].push(m);
            }

            Object.keys(groups).forEach(function (key) {
                groups[key].sort(function (a, b) { return (a.dist || 0) - (b.dist || 0); });
            });

            var frag = document.createDocumentFragment();

            for (var pi = 0; pi < palette.length; pi++) {
                var palEl = document.createElement("div");
                palEl.classList.add("colour", "swatch-p");
                palEl.dataset.index = pi;
                palEl.style.backgroundColor = palette[pi] || "";
                palEl.title = paletteTitles[pi] || "";
                (function (idx) {
                    palEl.addEventListener("click", function (evt) {
                        _30c = idx;
                        mr(_30c, false, true);
                        nn(evt);
                    });
                })(pi);
                frag.appendChild(palEl);

                var group = groups[String(pi)];
                if (group) {
                    for (var g = 0; g < group.length; g++) {
                        var obj = group[g];
                        var aEl = document.createElement("div");
                        aEl.classList.add("colour", "swatch-a");
                        aEl.dataset.addonIndex = obj.i;
                        aEl.style.backgroundColor = obj.rgb ? ("rgb(" + obj.rgb[0] + "," + obj.rgb[1] + "," + obj.rgb[2] + ")") : "";
                        aEl.title = obj.title || "";
                        (function (el) {
                            el.addEventListener("click", function (evt) {
                                var extractedRGB = cssToRGB(el.style.backgroundColor);
                                _30c = extractedRGB;
                                mr(extractedRGB, false, true);
                                document.querySelectorAll(".swatch-p.selected, .swatch-a.selected, #customcolour.selected").forEach(function (s) { s.classList.remove("selected") });
                                el.classList.add("selected");
                                nn(evt);
                            });
                        })(aEl);
                        frag.appendChild(aEl);
                    }
                }
            }

            if (groups["__end"]) {
                for (var e = 0; e < groups["__end"].length; e++) {
                    var obj = groups["__end"][e];
                    var aEl2 = document.createElement("div");
                    aEl2.classList.add("colour", "swatch-a");
                    aEl2.dataset.addonIndex = obj.i;
                    aEl2.style.backgroundColor = obj.rgb ? ("rgb(" + obj.rgb[0] + "," + obj.rgb[1] + "," + obj.rgb[2] + ")") : "";
                    aEl2.title = obj.title || "";
                    (function (el) {
                        el.addEventListener("click", function (evt) {
                            var extractedRGB = cssToRGB(el.style.backgroundColor);
                            _30c = extractedRGB;
                            mr(extractedRGB, false, true);
                            document.querySelectorAll(".swatch-p.selected, .swatch-a.selected, #customcolour.selected").forEach(function (s) { s.classList.remove("selected") });
                            el.classList.add("selected");
                            nn(evt);
                        });
                    })(aEl2);
                    frag.appendChild(aEl2);
                }
            }

            w.appendChild(frag);
        }
        function dr() {
            var e = n;
            ie(!1),
                M["classList"]["contains"]("open") ? (M.classList["remove"]("open"),
                    en()) : (M["classList"]["add"]("open"),
                        2 == lr && ur(0),
                        document.getElementById("tpword")["focus"]())
        }
        function fr(e) {
            return e["replace"](/^\/|\/$/g, "")
        }
        function vr(e) {
            var t = n
                , r = (e = (e = fr(e))["replace"](/\~\/*/, "~"))["split"]("/");
            if (e = r["shift"](),
                r["length"] > 0 && (e += "/" + r["shift"]()),
                (e = (e = fr(e))["toLowerCase"]())["startsWith"]("~") && "~main" != e) {
                var a = e["split"]("/")
                    , o = a[0]["replace"]("~", "")
                    , i = "main";
                a.length > 1 && (i = a[1]),
                    Cn(o, i),
                    Zn(0, 0)
            } else {
                var c = Lr(e);
                Zn(c.x, c.y),
                    Cn("textwall", "main"),
                    0 == c.x && 0 == c.y ? $n() : history["pushState"]({}, null, e)
            }
            document.querySelectorAll(".typing-notice").forEach(el => el.innerText = "nobody is typing.");
            M["classList"]["remove"]("open")
        }

        function mr(e, noSave = false, select = true) {
            if (colorsDisabled) return;
            if (tt.disablecolour.checked) { e = 0 };
            let hexColor = null;
            let newEl = null;

            if (typeof e === "string" && (e.startsWith("#") || e.startsWith("0x"))) {
                let cleanHex = e.startsWith("0x") ? e.slice(2) : e.slice(1);
                if (cleanHex.length === 3) {
                    cleanHex = cleanHex.split('').map(char => char + char).join('');
                }
                if (/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
                    let r = parseInt(cleanHex.substring(0, 2), 16);
                    let g = parseInt(cleanHex.substring(2, 4), 16);
                    let b = parseInt(cleanHex.substring(4, 6), 16);
                    e = [r, g, b];
                }
            }
            if (typeof e === "string" && e.startsWith("rgb")) {
                let rgbMatch = e.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbMatch) {
                    let r = parseInt(rgbMatch[1], 10);
                    let g = parseInt(rgbMatch[2], 10);
                    let b = parseInt(rgbMatch[3], 10);
                    e = [r, g, b];
                }
            }

            if (Array.isArray(e)) {
                if (e.length >= 3) {
                    let r = e[0] & 255,
                        g = e[1] & 255,
                        b = e[2] & 255;
                    hexColor = "#" + r.toString(16).padStart(2, "0") +
                        g.toString(16).padStart(2, "0") +
                        b.toString(16).padStart(2, "0");
                } else return;
            } else {
                e = parseInt(e, 10);
            }

            if (select) {
                document.querySelectorAll(".swatch-p.selected").forEach(el => el.classList.remove("selected"));
                document.querySelectorAll(".swatch-a.selected").forEach(el => el.classList.remove("selected"));
                const custom = document.querySelector("#customcolour.selected, .customcolour.selected");
                if (custom) custom.classList.remove("selected");
            }

            pe = e;
            window.color = pe;

            if (typeof e === "number" && !isNaN(e) && e < se.length) {
                be = xe && e === 0 ? "rgba(255,255,255,0.6)" : Yr(se[e], 0.6);
                newEl = document.querySelector(`.swatch-p[data-index='${e}']`);
            }
            else if (typeof e === "number" && !isNaN(e) && e >= se.length) {
                let addonIndex = e - se.length;
                let obj = rgbse[addonIndex];
                if (obj) {
                    be = gst(Array.isArray(obj) ? ("rgb(" + obj[0] + "," + obj[1] + "," + obj[2] + ")") : obj, 0.6);
                    newEl = document.querySelector(`.swatch-a[data-addon-index='${addonIndex}']`);
                }
            }
            else if (hexColor) {
                be = gst(hexColor, 0.6);
                let ct = document.querySelector("#customcolour");
                if (ct && ct.jscolor) ct.jscolor.fromString(hexColor);
                newEl = ct;
            }

            if (select && newEl) newEl.classList.add("selected");

            if (!noSave) localStorage.setItem("col", e);
            ge = true;
            Oe = true;
        }

        let total = se.length + rgbse.length;

        if (w.children.length > 0) a = !0;
        sr();

        function hr(e) {
            for (var t = n, r = 0; r < w.children.length; r++) {
                if (w["children"][r].getAttribute("data-index") != "0") {
                    if (e) {
                        w["children"][r]["classList"].add("hidden");
                    } else {
                        w["children"][r].classList.remove("hidden");
                    }
                }
            }
            var customColour = document.getElementById("customcolour");
            if (customColour) {
                if (e) {
                    customColour.classList.add("hidden");
                } else {
                    customColour.classList.remove("hidden");
                }
            }

            e && mr(0);
        }
        function yr(e, noSave = !1) {
            var t = n;
            if (null != e)
                N = e;
            else
                switch (N) {
                    case 0:
                        N = 1;
                        break;
                    case 1:
                        N = 2;
                        break;
                    case 2:
                        N = 0
                }
            0 == N && (xe = !1,
                document["getElementById"]("themeico")["src"] = "/static/sun.svg",
                C = S,
                A = I),
                1 == N && (xe = !0,
                    document["getElementById"]("themeico")["src"] = "/static/moon.svg",
                    C = "#000000",
                    A = "#141414"),
                2 == N ? (xe = P.checked,
                    document.getElementById("themeico")["src"] = "/static/star.svg",
                    C = B["value"],
                    A = F["value"],
                    L["classList"].remove("hidden")) : L.classList["add"]("hidden"),
                T = Xr(A, 10),
                !noSave && localStorage.setItem("theme", N),
                ge = !0,
                en(),
                mr(pe),
                Sn()
        }
        function gr(e) {
            var t = n;
            e["target"] == B ? (C = B["value"],
                Sn()) : e.target == F && (A = F.value,
                    T = Xr(A, 10),
                    Sn(!0)),
                localStorage["setItem"]("customtheme", JSON["stringify"]({
                    primary: B.value,
                    secondary: F["value"],
                    texttheme: P["checked"]
                }))
        }
        function pr(e) {
            var t = n;
            br(e["target"]["parentElement"].id),
                en()
        }
        function br(e, t) {
            var r = n
                , a = ae[e];
            a.enabled = null != t ? t : !a.enabled,
                a["enabled"] ? a.el["classList"]["add"]("enabled") : a.el["classList"]["remove"]("enabled"),
                localStorage.setItem("dec", ce())
        }
        function xr(e, t, r) {
            var a = n;
            if (Math["abs"](e - t) > .1) {
                for (var o = 0; o < r; o++)
                    e += (t - e) / 20;
                return ge = !0,
                    Math["round"](100 * e) / 100
            }
            return e != t ? (ge = !0,
                Math["round"](e)) : e
        }
        var uP = 50;

        var aB;

        function setWriteInterval() {
            if (aB) clearInterval(aB);
            aB = setInterval(flushWrites, uP);
        }
        window.flushAmount = 250
        function flushWrites() {
            var e = n;
            if (a && a["readyState"] == a["OPEN"]) {
                if ((Le || Oe || Re || De) && we.size !== 0) {
                    var t = {};
                    Le && (t.l = [Ce.x, Ce.y]);
                    Oe && (t.c = pe);
                    Re && (t.n = tt["anonymous"]["checked"]);
                    De && (t.p = [qe.coords.x, qe.coords.y]);

                    a["send"](Or({ ce: t }));
                    Le = Oe = Re = De = false;
                }

                if (Me.length > 0) {
                    var r = Me.splice(0),
                        chunkMap = new Map();
                    for (var o = 0; o < r.length; o++) {
                        var [i, c, l, u, s] = r[o];
                        var key = i + "," + c;
                        var cells = chunkMap.get(key);
                        if (!cells) {
                            cells = new Map();
                            chunkMap.set(key, cells);
                        }
                        cells.set(u, [l, s]);
                    }
                    var tA = [];
                    chunkMap.forEach(function (cells, key) {
                        var parts = key.split(",");
                        var arr = [+parts[0], +parts[1]];
                        cells.forEach(function (pair, idx) {
                            arr.push(pair[0], idx, pair[1]);
                        });
                        tA.push(arr);
                    });
                    var MAX_CHUNKS = 64;
                    for (var p = 0; p < tA.length; p += MAX_CHUNKS) {
                        a.send(Or({ e: tA.slice(p, p + MAX_CHUNKS) }));
                    }
                }
            }
        }
        window.setWriteInterval = setWriteInterval;
        function setFlushInterval(newer) {
            var int = parseInt(newer);
            if (isNaN(int)) int = 50;
            if (int < 0) int = 0;
            uP = int;
            setWriteInterval(); // restart interval
        }
        window.cursors = Pe;
        window.cursor = Ce;
        window.writeFlushRate = uP;
        window.flushWrites = flushWrites;


        window.w.setFlushInterval = setFlushInterval;
        window.w.changeTheme = function (e, noSave = !1) {
            if (e === undefined) {
                yr(0)
                return;
            }
            if (e == "light") yr(0, noSave);
            else if (e == "dark") yr(1, noSave);
            else if (e == "custom") yr(2, noSave);
            else yr(e, noSave);


        }
        window.w.setPrimaryColor = function (e) { B.value = e; gr({ target: B }); }
        window.w.setSecondaryColor = function (e) { F.value = e; gr({ target: F }); }
        window.w.toggleTeleport = dr;
        window.w.color = function () { document.getElementById("colourcontainer").classList.toggle("hidden") }

        window.w.settings = function () {
            document.body.classList.toggle("menu-open");
            sidemenu.classList.toggle("open");
        };

        window.Tile = {}
        window.Tile.get = function (e, t) {
            var r = n;
            if (!we["has"](e + "," + t))
                return null;
            var a = we.get(e + "," + t);
            return a
        };
        window.Tile.set = function (e, t, r, a) {
            var o = n;
            if (!we["has"](e + "," + t))
                return !1;
            var i = we.get(e + "," + t);
            return i["txt"][r] = a,
                !0
        }
        window.Tile.exists = function (e, t) {
            var r = n;
            return we["has"](e + "," + t)
        }
        window.Tile.loaded = function (e, t) {
            return !!Tile.get(e, t)
        }
        window.Tile.delete = function (e, t) {
            var r = n;
            if (!we["has"](e + "," + t))
                return !1;
            var a = we.get(e + "," + t);
            return a.protected ? !1 : (we.delete(e + "," + t),
                !0)
        }
        window.Tile.visible = function (e, t) {
            var r = n;
            if (!we["has"](e + "," + t))
                return !1;
            var a = we.get(e + "," + t);
            return !xt([e, t], bt(20))
        }
        window.Tile.empty = function (e, t) {
            return Tile.exists(e, t) && Tile.get(e, t).empty
        }
        window.Tile.protected = function (e, t) {
            return Tile.exists(e, t) && Tile.get(e, t).protected
        }
        /* window.Tile.textProtected = function (cellX, cellY) {
             var chunkX = Math.floor(cellX / 20);
             var chunkY = Math.floor(cellY / 10);
             var tileX = cellX % 20;
             var tileY = cellY % 10;
             var cellIdx = tileY * 20 + tileX;
             var chunkKey = (20 * chunkX) + "," + (10 * chunkY);
 
             if (!we["has"](chunkKey)) return false;
             var chunk = we.get(chunkKey);
             return chunk["textProtected"] && chunk["textProtected"][cellIdx] === "1";
         }
         window.Tile.toggleTextProtection = function (cellX, cellY) {
             //if (!m && 0 == j) return false; // Only allow if member or admin
 
             var data = {
                 tp: `${cellX},${cellY}`
             };
             if (w.socket && w.socket.readyState === WebSocket.OPEN) {
                 var enc = network.binary(data);
                 try {
                     w.socket.send(enc);
                 } catch (e) {
                 }
             }
             return true;
         } */
        window.Tile.saveBlob = function (e, t) {
            var r = n;
            if (!we["has"](e + "," + t)) return null;

            var tile = we.get(e + "," + t);
            if (!tile || !tile.img) return null;

            var img = tile.img;

            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(function (blob) {
                if (!blob) return;

                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = `tile_${e}_${t}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };

        window.w.goto = vr;
        window.w.tp = Zn;
        window.w.cursors = Pe;
        window.w.redraw = () => ge = !0;
        window.w.renderChunkAmount = renderChunkAmount;
        window.w.setRenderChunkAmount = function (e) { renderChunkAmount = parseInt(e, 0); ge = !0 };
        window.w.getTheme = function () { return { mode: N, primary: C, secondary: A, texttheme: P.checked }; };
        window.getChar = function (e, t, r = 0, a = 0) {
            if (e === undefined || t === undefined || r === undefined || a === undefined) {
                [e, t, r, a] = window.cursorCoords;
            }

            const Xq = Tile.get(e, t);
            if (!Xq) return null;

            const Md = 20;
            const Fh = 10;

            if (r < 0) {
                e -= Math.ceil(Math.abs(r) / Md);
                r = (r % Md + Md) % Md;
            }
            if (a < 0) {
                t -= Math.ceil(Math.abs(a) / Fh);
                a = (a % Fh + Fh) % Fh;
            }

            const Tp = a * Md + r;
            return Xq.txt[Tp];
        };

        window.getCharDecoration = function (e) {
            let Lj = 0;

            if (Array.isArray(e)) {

                Lj = e.length > 3 ? e[3] : 0;
            } else {

                Lj = Math.floor(e / 31);
            }

            return {
                bold: (Lj & 8) === 8,
                italic: (Lj & 4) === 4,
                underline: (Lj & 2) === 2,
                strike: (Lj & 1) === 1
            };
        };

        window.getCharColor = function (e, t, r = 0, a = 0) {
            if (e === undefined || t === undefined || r === undefined || a === undefined) {
                [e, t, r, a] = window.cursorCoords;
            }

            const Vz = Tile.get(e, t);
            if (!Vz) return null;

            const Rn = 20;
            const Bw = 10;

            if (r < 0) {
                e -= Math.ceil(Math.abs(r) / Rn);
                r = (r % Rn + Rn) % Rn;
            }
            if (a < 0) {
                t -= Math.ceil(Math.abs(a) / Bw);
                a = (a % Bw + Bw) % Bw;
            }

            const Kf = a * Rn + r;
            const Jy = Vz.clr[Kf];
            return Array.isArray(Jy) ? Jy.slice(0, 3) : (Jy % 31);
        };

        window.getCharInfo = function (e, t, r = 0, a = 0) {
            if (e === undefined || t === undefined || r === undefined || a === undefined) {
                [e, t, r, a] = window.cursorCoords;
            }

            const Qm = Tile.get(e, t);
            if (!Qm) return null;

            const Nw = 20;
            const Xv = 10;

            if (r < 0) {
                e -= Math.ceil(Math.abs(r) / Nw);
                r = (r % Nw + Nw) % Nw;
            }
            if (a < 0) {
                t -= Math.ceil(Math.abs(a) / Xv);
                a = (a % Xv + Xv) % Xv;
            }

            const Pd = a * Nw + r;
            const Uf = Qm.txt[Pd];
            const Jy = Qm.clr[Pd];
            const Gh = Array.isArray(Jy) ? Jy.slice(0, 3) : (Jy % 31);

            return {
                tileCoords: [e, t, r, a],
                char: Uf,
                color: Gh,
                deco: getCharDecoration(Jy)
            };
        };
        window.getCharInfoXY = function (e, t) {
            const Rd = Math.floor(e / 20) * 20;
            const Bs = Math.floor(t / 10) * 10;
            const Qp = e % 20;
            const Lk = t % 10;
            return getCharInfo(Rd, Bs, Qp, Lk);
        };


        window.XYtoTile = function (x, y) {
            const tileX = Math.floor(x / 20) * 20;
            const tileY = Math.floor(y / 10) * 10;
            const offsetX = x - Math.floor(x / 20) * 20;
            const offsetY = y - Math.floor(y / 10) * 10;
            return [tileX, tileY, offsetX, offsetY];
        }
        Object.defineProperty(window, "cursorCoords", {
            get: function () {
                var e = n;
                const [tileX, tileY, offsetX, offsetY] = XYtoTile(Ce.x, Ce.y);
                return [tileX, tileY, offsetX, offsetY];
            }
        });
        Object.defineProperty(window, "cursorCoordsXY", {
            get: function () {
                return [Ce.x, Ce.y];
            }
        });
        window.getTileCoordsFromMouseCoords = function (e) {
            var { x, y } = Wn(e);
            return XYtoTile(x, y);
        }
        window.getXYCoordsFromMouseCoords = Wn;
        setWriteInterval();
        var wr = performance.now()
            , Mr = 100
            , kr = performance["now"]() + 1e3;
        window.requestAnimationFrame((function e() {
            var t = n
                , r = Math["min"](Math["ceil"](performance["now"]() - wr), 100);

            if (wr = performance.now(),
                (r < Mr || wr > kr) && (Mr = r,
                    kr = performance["now"]() + 1e3),
                null != Qe) {
                ge = !0,
                    Mn(qe["offset"].x + Qe.dx, qe["offset"].y + Qe.dy, !0),
                    0 == Qe.dx && 0 == Qe.dy && Mn(qe.offset.x, qe["offset"].y);
                for (var a = 0; a < r; a++)
                    Qe.dx *= .993,
                        Qe.dy *= .993;
                Math["abs"](Qe.dx) <= .3 && (Qe.dx = 0),
                    Math.abs(Qe.dy) <= .3 && (Qe.dy = 0),
                    0 == Qe.dy && 0 == Qe.dx && (Qe = null)
            }
            if (tt["smoothcursors"]["checked"]) {
                Ce.rawx = xr(Ce["rawx"], Ce.x, r),
                    Ce.rawy = xr(Ce["rawy"], Ce.y, r);
                var o = bt(20);
                for (const e of Pe.values())
                    null == e["rawx"] || null == e["rawy"] || xt(e.l, o) || (e["rawx"] = xr(e["rawx"], e.l[0], r),
                        e["rawy"] = xr(e["rawy"], e.l[1], r))
            }
            if (0 != Ne.length) {
                for (var c = 0; c < Ne["length"]; c++)
                    if (Ne[c][2] < .01)
                        Ne["splice"](c, 1);
                    else
                        for (a = 0; a < r; a++)
                            Ne[c][2] *= .995;
                ge = !0
            }
            if (ge && (function () {
                var e = t;
                E["setTransform"](1, 0, 0, 1, 0, 0),
                    E["fillStyle"] = A,
                    E["fillRect"](0, 0, k["width"], k["height"]),
                    E["translate"](Math.ceil(qe["offset"].x), Math["ceil"](qe.offset.y));
                const r = 10 * v
                    , a = 20 * v
                    , o = Math["round"](5 * v);
                var i, c, l, u, s = bt(20), f = bt(d);
                for (const t of we["keys"]())
                    xt(h = wt(t), s) ? xt(h, f) && delete we.get(t)["img"] : pt(t, h);
                if (tt["showothercurs"]["checked"] && (!nt.hideCursors["checked"] || m)) {
                    gt(E);
                    for (const t of Pe.values()) {
                        var h = t.l;
                        if (!xt(h, s)) {
                            var y = Math.round(10 * t.rawx * v)
                                , g = Math.round(20 * t["rawy"] * v);
                            t["highlighted"] && (E["fillStyle"] = "rgba(239, 255, 71, 0.5)",
                                E["roundRect"](y - 2 * v, g - 2 * v, Math["ceil"](r) + 4 * v, Math.round(a) + 4 * v, [2 * v]));
                            var p = t.c;
                            var anonIdShow = tt["anonIdShow"].checked;
                            var displayNameShow = tt["displayNames"].checked;
                            tt.disablecolour["checked"] && (p = 0),
                                0 == p && xe && (p = se["length"]);
                            if (rgb888(p)) {
                                E["fillStyle"] = gst(p);
                            } else {
                                E["fillStyle"] = gst(se[p], 0.2) || "rgba(255,255,255,0.2)";
                            };
                            tt.roundCursors["checked"] ?
                                (ge = !0, E.beginPath(),
                                    E.lineWidth = 2 * v,
                                    kt(y, g, r, a, 2 * v),
                                    E.fill()) :
                                (ge = !0, kt(y, g, r, a)),
                                !tt["shownametags"]["checked"] || (i = h,
                                    c = void 0,
                                    l = void 0,
                                    u = void 0,
                                    c = n,
                                    l = 20 * Math["floor"](i[0] / 20) + "," + 10 * Math.floor(i[1] / 10),

                                    (u = we["get"](l)) && u.protected && 0 == j) || Mt(
                                        t.n != ""
                                            ? (displayNameShow ? t.dn : t.n)
                                            : (anonIdShow ? `(${t.id || 0})` : ""),
                                        y, g, o
                                    )
                        }
                    }
                }
                for (var b = 0; b < Ne["length"]; b++) {
                    0 == (p = Ne[b][3]) && xe && (p = se["length"]),
                        E["fillStyle"] = rgb888(p) ? gst(p) : me[p];
                    var x = 10 * Ne[b][0] * v
                        , w = 20 * Ne[b][1] * v;
                    if (tt["showothercurs"]["checked"] && m) {
                        var M = Pe.get(Ne[b][4]);
                        null != M && M["highlighted"] && (E.lineWidth = 3 * v,
                            E["strokeStyle"] = rgb888(p) ? gst(p) : se[p],
                            E["beginPath"](),
                            E["moveTo"](Math["round"](10 * M["rawx"] * v + r / 2), Math["round"](20 * M["rawy"] * v + a)),
                            E["lineTo"](Math["round"](x + r / 2), Math.round(w + a)),
                            E.stroke())
                    }

                    E["fillRect"](x, w, r, a)
                }
                var anonIdShow = tt['anonIdShow'].checked;
                var displayNameShow = tt["displayNames"].checked;
                if (tt.roundCursors["checked"] ? (E["fillStyle"] = be,
                    E.beginPath(),
                    E.lineWidth = 2 * v,
                    kt(y = Math["round"](10 * Ce["rawx"] * v), g = Math["round"](20 * Ce["rawy"] * v), r, a, 2 * v),
                    E.fill()) :
                    (
                        E["fillStyle"] = be,
                        kt(y = Math["round"](10 * Ce["rawx"] * v), g = Math["round"](20 * Ce["rawy"] * v), r, a)
                    ),
                    tt["shownametags"].checked && (gt(E),
                        Mt(
                            (tt["anonymous"]["checked"] || je == "")
                                ? (anonIdShow ? `(${window.w.clientId || 0})` : "")
                                : (displayNameShow ? window.w.displayNick : je),
                            y, g, o
                        )),
                    Je && $e["start"] && $e["end"]) {
                    E.fillStyle = "rgba(0,120,212,0.5)",


                        y = Math["round"](10 * Math["min"]($e["start"].x, $e.end.x) * v),
                        g = Math.round(20 * Math.min($e["start"].y, $e["end"].y) * v);
                    var S = Math.round(10 * Math.max($e["start"].x, $e["end"].x) * v - y + 10 * v)
                        , I = Math.round(20 * Math["max"]($e["start"].y, $e["end"].y) * v - g + 20 * v);
                    E["fillRect"](y, g, S, I)

                }
                if (Ve || Ze) {

                    E["fillStyle"] = Ve && Ze ? "rgba(195,219,224,0.5)" : (Ve ? "rgba(204,204,204,0.5)" : "rgba(221,249,255,0.5)")
                    var C = 20 * Math.floor(Te.x / 20)
                        , T = 10 * Math["floor"](Te.y / 10);
                    E.fillRect(10 * C * v, 20 * T * v, 200 * v, 200 * v)
                }
            }(), ge = !1,
                "\n\n\n\n\n\n\n\n\n" != i.value && (i.value = "\n\n\n\n\n\n\n\n\n"),
                i["selectionEnd"] = 4),
                0 != Ee["size"]) {
                for (var l = wr + (Mr - 2); ;) {
                    var u = ke.shift()
                        , s = Ee["get"](u);
                    if (Ee["delete"](u),
                        Xt(u, s),
                        0 == Ee.size || performance.now() >= l)
                        break
                }
                ge = !0
            }
            window["requestAnimationFrame"](e)
        }
        )),
            null != localStorage["getItem"]("x") && (Ce.x = parseInt(localStorage["getItem"]("x"))),
            null != localStorage["getItem"]("y") && (Ce.y = parseInt(localStorage["getItem"]("y"))),
            null != localStorage["getItem"]("dec") && le(localStorage["getItem"]("dec")),
            null != localStorage.getItem("customfont") && (O["value"] = localStorage["getItem"]("customfont")),
            null != localStorage.getItem("customfontsize") && (R.value = localStorage["getItem"]("customfontsize")),
            null != localStorage.getItem("rca") && (renderChunkAmount = parseInt(localStorage.getItem("rca"), rot.value = parseInt(localStorage.getItem("rca")))),
            null != $[localStorage["getItem"]("font")] && vt(localStorage["getItem"]("font"));
        const val = localStorage["getItem"]("col");
        if (val != null) {
            const parts = val.split(",");
            if (parts.length === 3) {
                mr(parts.map(Number), true);
            } else {
                mr(parseInt(val), true);
            }
        } else {
            mr(0, true);
        }

        var Er = Object["keys"](tt);
        for (ne = 0; ne < Er["length"]; ne++) {
            var Sr = Er[ne];
            null != localStorage.getItem(Sr) && (tt[Sr]["checked"] = "true" == localStorage["getItem"](Sr))
        }
        if (tt["showchat"].checked,
            tt["disablecolour"]["checked"] && hr(!0),
            null != localStorage["getItem"]("customtheme")) {
            var Ir = localStorage.getItem("customtheme");
            try {
                var Cr = JSON.parse(Ir);
                null != Cr["primary"] && (B["value"] = Cr["primary"]),
                    null != Cr.secondary && (F["value"] = Cr.secondary),
                    null != Cr["texttheme"] && (P.checked = Cr["texttheme"])
            } catch (e) { }
        }
        if (null != localStorage.getItem("theme")) {
            var Ar = localStorage["getItem"]("theme");
            yr(0 == Ar || 1 == Ar || 2 == Ar ? Number(Ar) : N)
        }
        var Tr, Br = (Tr = {},
            window.location["href"]["replace"](/[?&]+([^=&]+)=([^&]*)/gi, (function (e, t, n) {
                Tr[t] = n
            }
            )),
            Tr), Fr = !1;
        function Pr() {
            return fr(location.pathname)
        }
        function Lr_01(seed) {
            let key = [];
            let s = [];
            let j = 0;
            let i = 0;

            seed = seed + "";

            for (let k = 0; k < seed.length; k++) {
                key[k & 255] = (key[k & 255] || 0) ^ seed.charCodeAt(k);
            }

            let keyLen = key.length || 1;

            for (let n = 0; n < 256; n++) s[n] = n;

            for (let n = 0; n < 256; n++) {
                j = (j + s[n] + key[n % keyLen]) & 255;
                [s[n], s[j]] = [s[j], s[n]];
            }

            function byte() {
                i = (i + 1) & 255;
                j = (j + s[i]) & 255;
                [s[i], s[j]] = [s[j], s[i]];
                return s[(s[i] + s[j]) & 255];
            }

            return function rand() {
                let num = 0;
                let denom = 1;

                for (let k = 0; k < 6; k++) {
                    num = num * 256 + byte();
                    denom *= 256;
                }

                return num / denom;
            };
        }


        function Lr_02(str) {
            let tpl = {
                maxX: 100000,
                maxY: 100000,
                text: str
            };

            let m = str.match(/^\[(.*?)\](.*)$/);
            if (!m) return tpl;

            let params = m[1].split(",");
            tpl.text = m[2];

            for (let p of params) {
                let [k, v] = p.split("=");
                if (!k || v == null) continue;

                k = k.trim();
                v = v.trim();

                if (k === "maxX") tpl.maxX = Number(Math.min(v, 274000000));
                if (k === "maxY") tpl.maxY = Number(Math.min(v, 275000000));
            }

            return tpl;
        }


        function Lr(input) {

            input = decodeURI((input || "").trim());
            if (!input) return { x: 0, y: 0 };

            let tpl = Lr_02(input);

            let seed = input;
            let rand = Lr_01(seed);

            function axis(max, snap) {
                let raw = Math.round(2 * max * rand()) - max;
                return snap * Math.round(raw / snap);
            }

            return {
                x: axis(tpl.maxX, 20),
                y: axis(tpl.maxY, 10)
            };
        }

        function oldLr(input) {
            let normalized = decodeURI((input || "").toLowerCase());
            if (normalized === "" || normalized === "~main") {
                return { x: 0, y: 0 };
            }

            var rand = (function (seed) {
                var key = [];
                var seedStr = seed + "";
                var len = seedStr.length;
                var xorState = 0;


                for (var i = 0; i < len; i++) {
                    key[255 & i] = 255 & (xorState ^= 19 * key[255 & i]) + seedStr.codePointAt(i);
                }

                var keyLen = key.length;
                if (!keyLen) {
                    key = [keyLen++];
                }


                var sBox = [];
                for (var s = 0; s < 256; s++) {
                    sBox[s] = s;
                }


                var j = 0;
                for (var s = 0; s < 256; s++) {
                    var temp = sBox[s];
                    j = 255 & (j + key[s % keyLen] + temp);
                    sBox[s] = sBox[j];
                    sBox[j] = temp;
                }


                var iState = 0;
                var jState = 0;

                var nextByte = function (count) {
                    var output = 0;
                    while (count--) {
                        iState = 255 & (iState + 1);
                        var t = sBox[iState];
                        jState = 255 & (jState + t);

                        sBox[iState] = sBox[jState];
                        sBox[jState] = t;

                        output = 256 * output + sBox[255 & (sBox[iState] + sBox[jState])];
                    }
                    return output;
                };
                nextByte(256);

                return function () {
                    var e = nextByte(6);
                    var t = 281474976710656;
                    var n = 0;

                    while (e < 4503599627370496) {
                        e = 256 * (e + n);
                        t *= 256;
                        n = nextByte(1);
                    }
                    while (e >= 9007199254740992) {
                        e /= 2;
                        t /= 2;
                        n >>>= 1;
                    }
                    return (e + n) / t;
                };
            })(normalized);
            var rawX = Math.floor(200000 * rand()) - 100000;
            var rawY = Math.floor(200000 * rand()) - 100000;

            return {
                x: 20 * Math.floor(rawX / 20),
                y: 10 * Math.floor(rawY / 10)
            };
        }
        window.w.generateCoords = Lr;
        window.w.generateCoordsOld = oldLr;
        null != Br.x && (Ce.x = parseInt(Br.x),
            Fr = !0),
            null != Br.y && (Ce.y = -1 * parseInt(Br.y),
                Fr = !0),
            Br["noui"] && (l["classList"].add("hidden"),
                hn["style"]["display"] = "none");
        var Or, Rr, Dr, Nr, jr, Ur, Wr = Pr();
        if (Wr.length > 0)
            if (Wr["startsWith"]("~"))
                o = "/" + Wr,
                    Fr || Zn(0, 0);
            else {
                var Hr = Lr(Wr);
                Ce.x = Hr.x,
                    Ce.y = Hr.y
            }
        function Kr() {
            var e = n;
            if (null == a || a["readyState"] != WebSocket.CONNECTING && a["readyState"] != WebSocket.OPEN) {
                var t = "wss://" + location.host + "/ws";
                "https:" !== location.protocol && (t = "ws://" + location["host"] + "/ws"),
                    (a = new WebSocket(t, window.w.currentVersion))["binaryType"] = "arraybuffer",
                    a.onmessage = Tn,
                    a["onclose"] = An,
                    a["onerror"] = An,
                    a.onopen = In,
                    document.getElementById("connecting1")["innerText"] = "Connecting...",
                    document["getElementById"]("connecting2").innerText = "",
                    document.getElementById("connecting3").innerText = "",
                    c["onclick"] = void 0
            }
        }
        function Xr(e, t) {
            var r = n
                , a = parseInt(e["substring"](1, 3), 16)
                , o = parseInt(e["substring"](3, 5), 16)
                , i = parseInt(e["substring"](5, 7), 16);
            return a += t,
                o += t,
                i += t,
                a = Math.min(a, 255),
                o = Math["min"](o, 255),
                i = Math["min"](i, 255),
                a = Math["max"](a, 0),
                o = Math.max(o, 0),
                i = Math["max"](i, 0),
                "#" + zr(a.toString(16), 2) + zr(o.toString(16), 2) + zr(i.toString(16), 2)
        }
        window.Xr = Xr;
        function zr(e, t) {
            for (; e.length < t;)
                e = "0" + e;
            return e
        }
        function qr(e) {
            return e >= 10240 && e <= 10495
        }
        function Yr(e, t) {

            var r = n;
            var o, i, c;


            if (Array.isArray(e) && e.length >= 3) {
                o = e[0] & 255;
                i = e[1] & 255;
                c = e[2] & 255;
            } else {

                if (3 == (e = e.replace("#", "")).length && (e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]),
                    6 != e["length"])
                    throw new Error("invalid hex length");
                var a = parseInt(e, 16);
                o = (16711680 & a) >> 16;
                i = (65280 & a) >> 8;
                c = 255 & a;
            }

            return t ? "rgba(" + o + ", " + i + ", " + c + ", " + t + ")" : "rgb(" + o + ", " + i + ", " + c + ")"

        }
        function Jr(e) {
            return e * e
        }
        function Vr(e, t) {
            return 31 * e + t
        }

        function ce2() {
            var decorations = {
                bold: ae.bold.enabled,
                italic: ae.italic.enabled,
                underline: ae.underline.enabled,
                strikethrough: ae.strikethrough.enabled
            }
            return decorations
        }
        function Zr(e) {
            if (Array.isArray(e)) {
                return [
                    [e[0] ?? 0, e[1] ?? 0, e[2] ?? 0],
                    e[3] ?? 0
                ];
            }

            if (typeof e !== "number" || !isFinite(e)) {
                return [0, 0];
            }

            return [
                e % 31,
                Math.floor(e / 31)
            ];
        }

        isNaN(Ce.x) && (Ce.x = 0),
            isNaN(Ce.y) && (Ce.y = 0),
            Ce["start"] = Ce.x,
            setTimeout((function () {
                var e = n;
                window["history"]["replaceState"]({}, document["title"], location["pathname"])
            }
            ), 0),
            Zn(Ce.x, Ce.y),
            null != localStorage.getItem("zoom") && it(JSON["parse"](localStorage["getItem"]("zoom")), !1),
            Kr(),
            Or = function (e, r) {
                var a = n;
                if (r && r["bdtiple"] && !Array.isArray(e))
                    throw new Error;
                const o = 4294967296;
                let i, c, l = new Uint8Array(128), u = 0;
                if (r && r["bdtiple"])
                    for (let t = 0; t < e["length"]; t++)
                        s(e[t]);
                else
                    s(e);
                return v(129),
                    l.subarray(0, u);
                function s(e, n) {
                    var l = a;
                    switch (typeof e) {
                        case "undefined":
                            d();
                            break;
                        case "boolean":
                            v(e ? 195 : 194);
                            break;
                        case "number":
                            !function (e) {
                                var t = l;
                                if (isFinite(e) && Math["floor"](e) === e)
                                    if (e >= 0 && e <= 127)
                                        v(e);
                                    else if (e < 0 && e >= -32)
                                        v(e);
                                    else if (e > 0 && e <= 255)
                                        m([204, e]);
                                    else if (e >= -128 && e <= 127)
                                        m([208, e]);
                                    else if (e > 0 && e <= 65535)
                                        m([205, e >>> 8, e]);
                                    else if (e >= -32768 && e <= 32767)
                                        m([209, e >>> 8, e]);
                                    else if (e > 0 && e <= 4294967295)
                                        m([206, e >>> 24, e >>> 16, e >>> 8, e]);
                                    else if (e >= -2147483648 && e <= 2147483647)
                                        m([210, e >>> 24, e >>> 16, e >>> 8, e]);
                                    else if (e > 0 && e <= 0x10000000000000000) {
                                        let t = e / o
                                            , n = e % o;
                                        m([211, t >>> 24, t >>> 16, t >>> 8, t, n >>> 24, n >>> 16, n >>> 8, n])
                                    } else
                                        e >= -0x8000000000000000 && e <= 0x8000000000000000 ? ("onclose",
                                            h(e)) : m(e < 0 ? [211, 128, 0, 0, 0, 0, 0, 0, 0] : [207, 255, 255, 255, 255, 255, 255, 255, 255]);
                                else
                                    c || (i = new ArrayBuffer(8),
                                        c = new DataView(i)),
                                        c.setFloat64(0, e),
                                        "subarray",
                                        m(new Uint8Array(i))
                            }(e);
                            break;
                        case "string":
                            !function (e) {
                                var n = l;
                                let r = function (e) {
                                    var n = t;
                                    let r = !0
                                        , a = e["length"];
                                    for (let t = 0; t < a; t++)
                                        if (e["charCodeAt"](t) > 127) {
                                            r = !1;
                                            break
                                        }
                                    let o = 0
                                        , i = new Uint8Array(e["length"] * (r ? 1 : 4));
                                    for (let t = 0; t !== a; t++) {
                                        let r = e["charCodeAt"](t);
                                        if (r < 128)
                                            i[o++] = r;
                                        else {
                                            if (r < 2048)
                                                i[o++] = r >> 6 | 192;
                                            else {
                                                if (r > 55295 && r < 56320) {
                                                    if (++t >= a)
                                                        throw new Error;
                                                    let n = e.charCodeAt(t);
                                                    if (n < 56320 || n > 57343)
                                                        throw new Error;
                                                    r = 65536 + ((1023 & r) << 10) + (1023 & n),
                                                        i[o++] = r >> 18 | 240,
                                                        i[o++] = r >> 12 & 63 | 128
                                                } else
                                                    i[o++] = r >> 12 | 224;
                                                i[o++] = r >> 6 & 63 | 128
                                            }
                                            i[o++] = 63 & r | 128
                                        }
                                    }
                                    return r ? i : i.subarray(0, o)
                                }(e)
                                    , a = r["length"];
                                a <= 31 ? v(160 + a) : m(a <= 255 ? [217, a] : a <= 65535 ? [218, a >>> 8, a] : [219, a >>> 24, a >>> 16, a >>> 8, a]),
                                    m(r)
                            }(e);
                            break;
                        case "object":
                            null === e ? d() : e instanceof Date ? function (e) {
                                let t = e.getTime() / 1e3;
                                if (0 === e.getMilliseconds() && t >= 0 && t < 4294967296)
                                    m([214, 255, t >>> 24, t >>> 16, t >>> 8, t]);
                                else if (t >= 0 && t < 17179869184) {
                                    let n = 1e6 * e.getMilliseconds();
                                    m([215, 255, n >>> 22, n >>> 14, n >>> 6, n << 2 >>> 0 | t / o, t >>> 24, t >>> 16, t >>> 8, t])
                                } else {
                                    let n = 1e6 * e.getMilliseconds();
                                    m([199, 12, 255, n >>> 24, n >>> 16, n >>> 8, n]),
                                        h(t)
                                }
                            }(e) : Array["isArray"](e) ? f(e) : e instanceof Uint8Array || e instanceof Uint8ClampedArray ? function (e) {
                                let t = e["length"];
                                m(t <= 15 ? [196, t] : t <= 65535 ? [197, t >>> 8, t] : [198, t >>> 24, t >>> 16, t >>> 8, t]),
                                    m(e)
                            }(e) : e instanceof Int8Array || e instanceof Int16Array || e instanceof Uint16Array || e instanceof Int32Array || e instanceof Uint32Array || e instanceof Float32Array || e instanceof Float64Array ? f(e) : function (e) {
                                let t = 0;
                                for (let n in e)
                                    void 0 !== e[n] && t++;
                                t <= 15 ? v(128 + t) : m(t <= 65535 ? [222, t >>> 8, t] : [223, t >>> 24, t >>> 16, t >>> 8, t]);
                                for (let t in e) {
                                    let n = e[t];
                                    void 0 !== n && (s(t),
                                        s(n))
                                }
                            }(e);
                            break;
                        default:
                            if (n || !r || !r["invalidTypeReplacement"])
                                throw new Error;
                            "function" == typeof r["invalidTypeReplacement"] ? s(r["invalidTypeReplacement"](e), !0) : s(r["invalidTypeReplacement"], !0)
                    }
                }
                function d(e) {
                    "submitnamechange"
                }
                function f(e) {
                    let t = e.length;
                    t <= 15 ? v(144 + t) : m(t <= 65535 ? [220, t >>> 8, t] : [221, t >>> 24, t >>> 16, t >>> 8, t]);
                    for (let n = 0; n < t; n++)
                        s(e[n])
                }
                function v(e) {
                    var t = a;
                    if (l["length"] < u + 1) {
                        let e = 2 * l["length"];
                        for (; e < u + 1;)
                            e *= 2;
                        let n = new Uint8Array(e);
                        n.set(l),
                            l = n
                    }
                    l[u] = e,
                        u++
                }
                function m(e) {
                    var t = a;
                    if (l["length"] < u + e.length) {
                        let n = 2 * l.length;
                        for (; n < u + e["length"];)
                            n *= 2;
                        let r = new Uint8Array(n);
                        r.set(l),
                            l = r
                    }
                    l["set"](e, u),
                        u += e["length"]
                }
                function h(e) {
                    var t = a;
                    let n, r;
                    e >= 0 ? (n = e / o,
                        r = e % o) : (e++,
                            n = Math.abs(e) / o,
                            r = Math["abs"](e) % o,
                            n = ~n,
                            r = ~r),
                        m([n >>> 24, n >>> 16, n >>> 8, n, r >>> 24, r >>> 16, r >>> 8, r])
                }
            }
            ,
            Rr = function (e, r) {
                var a = n;
                let o, i = 0;
                if (e instanceof ArrayBuffer && (e = new Uint8Array(e)),
                    "object" != typeof e || void 0 === e["length"])
                    throw new Error;
                if (!e["length"])
                    throw new Error;
                if (e instanceof Uint8Array || (e = new Uint8Array(e)),
                    r && r.bdtiple)
                    for (o = []; i < e["length"];)
                        o["push"](c());
                else
                    o = c();
                return o;
                function c() {
                    const t = e[i++];
                    if (t >= 0 && t <= 127)
                        return t;
                    if (t >= 128 && t <= 143)
                        return f(t - 128);
                    if (t >= 144 && t <= 159)
                        return v(t - 144);
                    if (t >= 160 && t <= 191)
                        return m(t - 160);
                    if (192 === t)
                        return null;
                    if (193 === t)
                        throw new Error;
                    if (194 === t)
                        return !1;
                    if (195 === t)
                        return !0;
                    if (196 === t)
                        return d(-1, 1);
                    if (197 === t)
                        return d(-1, 2);
                    if (198 === t)
                        return d(-1, 4);
                    if (199 === t)
                        return h(-1, 1);
                    if (200 === t)
                        return h(-1, 2);
                    if (201 === t)
                        return h(-1, 4);
                    if (202 === t)
                        return s(4);
                    if (203 === t)
                        return s(8);
                    if (204 === t)
                        return u(1);
                    if (205 === t)
                        return u(2);
                    if (206 === t)
                        return u(4);
                    if (207 === t)
                        return u(8);
                    if (208 === t)
                        return l(1);
                    if (209 === t)
                        return l(2);
                    if (210 === t)
                        return l(4);
                    if (211 === t)
                        return l(8);
                    if (212 === t)
                        return h(1);
                    if (213 === t)
                        return h(2);
                    if (214 === t)
                        return h(4);
                    if (215 === t)
                        return h(8);
                    if (216 === t)
                        return h(16);
                    if (217 === t)
                        return m(-1, 1);
                    if (218 === t)
                        return m(-1, 2);
                    if (219 === t)
                        return m(-1, 4);
                    if (220 === t)
                        return v(-1, 2);
                    if (221 === t)
                        return v(-1, 4);
                    if (222 === t)
                        return f(-1, 2);
                    if (223 === t)
                        return f(-1, 4);
                    if (t >= 224 && t <= 255)
                        return t - 256;
                    throw console.debug("msgpack array:", e),
                    new Error
                }
                function l(t) {
                    let n = 0
                        , r = !0;
                    for (; t-- > 0;)
                        if (r) {
                            let t = e[i++];
                            n += 127 & t,
                                128 & t && (n -= 128),
                                r = !1
                        } else
                            n *= 256,
                                n += e[i++];
                    return n
                }
                function u(t) {
                    let n = 0;
                    for (; t-- > 0;)
                        n *= 256,
                            n += e[i++];
                    return n
                }
                function s(t) {
                    var n = a;
                    let r = new DataView(e.buffer, i + e["byteOffset"], t);
                    return i += t,
                        4 === t ? r.getFloat32(0, !1) : 8 === t ? r["getFloat64"](0, !1) : void 0
                }
                function d(t, n) {
                    var r = a;
                    t < 0 && (t = u(n));
                    let o = e["subarray"](i, i + t);
                    return i += t,
                        o
                }
                function f(e, t) {
                    e < 0 && (e = u(t));
                    let n = {};
                    for (; e-- > 0;)
                        n[c()] = c();
                    return n
                }
                function v(e, t) {
                    var n = a;
                    e < 0 && (e = u(t));
                    let r = [];
                    for (; e-- > 0;)
                        r["push"](c());
                    return r
                }
                function m(n, r) {
                    n < 0 && (n = u(r));
                    let a = i;
                    return i += n,
                        function (e, n, r) {
                            var a = t;
                            let o = n
                                , i = "";
                            for (r += n; o < r;) {
                                let t = e[o++];
                                if (t > 127)
                                    if (t > 191 && t < 224) {
                                        if (o >= r)
                                            throw new Error;
                                        t = (31 & t) << 6 | 63 & e[o++]
                                    } else if (t > 223 && t < 240) {
                                        if (o + 1 >= r)
                                            throw new Error;
                                        t = (15 & t) << 12 | (63 & e[o++]) << 6 | 63 & e[o++]
                                    } else {
                                        if (!(t > 239 && t < 248))
                                            throw new Error;
                                        if (o + 2 >= r)
                                            throw new Error;
                                        t = (7 & t) << 18 | (63 & e[o++]) << 12 | (63 & e[o++]) << 6 | 63 & e[o++]
                                    }
                                if (t <= 65535)
                                    i += String["fromCharCode"](t);
                                else {
                                    if (!(t <= 1114111))
                                        throw new Error;
                                    t -= 65536,
                                        i += String.fromCharCode(t >> 10 | 55296),
                                        i += String["fromCharCode"](1023 & t | 56320)
                                }
                            }
                            return i
                        }(e, a, n)
                }
                function h(e, n) {
                    e < 0 && (e = u(n));
                    let r = u(1)
                        , a = d(e);
                    return 255 === r ? function (e) {
                        var n = t;
                        if (4 === e["length"]) {
                            let t = (e[0] << 24 >>> 0) + (e[1] << 16 >>> 0) + (e[2] << 8 >>> 0) + e[3];
                            return new Date(1e3 * t)
                        }
                        if (8 === e["length"]) {
                            let t = (e[0] << 22 >>> 0) + (e[1] << 14 >>> 0) + (e[2] << 6 >>> 0) + (e[3] >>> 2)
                                , n = 4294967296 * (3 & e[3]) + (e[4] << 24 >>> 0) + (e[5] << 16 >>> 0) + (e[6] << 8 >>> 0) + e[7];
                            return new Date(1e3 * n + t / 1e6)
                        }
                        if (12 === e["length"]) {
                            let t = (e[0] << 24 >>> 0) + (e[1] << 16 >>> 0) + (e[2] << 8 >>> 0) + e[3];
                            i -= 8;
                            let n = l(8);
                            return new Date(1e3 * n + t / 1e6)
                        }
                        throw new Error
                    }(a) : {
                        type: r,
                        data: a
                    }
                }
            }
            ,
            Array.prototype["includes"] || (Array["prototype"]["includes"] = function (e) {
                return !!~this.indexOf(e)
            }
            ),
            Array["prototype"]["indexOf"] || (Array["prototype"].indexOf = function (e, n, r) {
                "use strict";
                return function (a, o) {
                    if (null == this)
                        throw TypeError("Array.prototype.indexOf called on null or undefined");
                    var i = e(this)
                        , c = i.length >>> 0
                        , l = r(0 | o, c);
                    if (l < 0)
                        l = n(0, c + l);
                    else if (l >= c)
                        return -1;
                    if (void 0 === a) {
                        for (; l !== c; ++l)
                            if (void 0 === i[l] && l in i)
                                return l
                    } else if (a != a) {
                        for (; l !== c; ++l)
                            if (i[l] != i[l])
                                return l
                    } else
                        for (; l !== c; ++l)
                            if (i[l] === a)
                                return l;
                    return -1
                }
            }(Object, Math.max, Math["min"])),
            Array["from"] || (Array["from"] = (Dr = Object["prototype"]["toString"],
                Nr = function (e) {
                    return "function" == typeof e || "[object Function]" === Dr.call(e)
                }
                ,
                jr = Math["pow"](2, 53) - 1,
                Ur = function (e) {
                    var r, a, o = n, i = (r = t,
                        a = Number(e),
                        isNaN(a) ? 0 : 0 !== a && isFinite(a) ? (a > 0 ? 1 : -1) * Math["floor"](Math["abs"](a)) : a);
                    return Math["min"](Math["max"](i, 0), jr)
                }
                ,
                function (e) {
                    var t = n
                        , r = this
                        , a = Object(e);
                    if (null == e)
                        throw new TypeError("Array.from requires an array-like object - not null or undefined");
                    var o, i = arguments["length"] > 1 ? arguments[1] : void 0;
                    if (void 0 !== i) {
                        if (!Nr(i))
                            throw new TypeError("Array.from: when provided, the second argument must be a function");
                        arguments.length > 2 && (o = arguments[2])
                    }
                    for (var c, l = Ur(a.length), u = Nr(r) ? Object(new r(l)) : new Array(l), s = 0; s < l;)
                        c = a[s],
                            u[s] = i ? void 0 === o ? i(c, s) : i["call"](o, c, s) : c,
                            s += 1;
                    return u["length"] = l,
                        u
                }
            )),
            Math["sign"] || (Math["sign"] = function (e) {
                return (e > 0) - (e < 0) || +e
            }
            ),
            String.prototype.startsWith || Object.defineProperty(String["prototype"], "startsWith", {
                value: function (e, t) {
                    var r = n
                        , a = t > 0 ? 0 | t : 0;
                    return this.substring(a, a + e["length"]) === e
                }
            }),
            String["prototype"]["codePointAt"] || function () {
                "use strict";
                var e = n
                    , r = function () {
                        var e = t;
                        try {
                            var n = {}
                                , r = Object["defineProperty"]
                                , a = r(n, n, n) && r
                        } catch (e) { }
                        return a
                    }()
                    , a = function (e) {
                        var n = t;
                        if (null == this)
                            throw TypeError();
                        var r = String(this)
                            , a = r.length
                            , o = e ? Number(e) : 0;
                        if (o != o && (o = 0),
                            !(o < 0 || o >= a)) {
                            var i, c = r["charCodeAt"](o);
                            return c >= 55296 && c <= 56319 && a > o + 1 && (i = r["charCodeAt"](o + 1)) >= 56320 && i <= 57343 ? 1024 * (c - 55296) + i - 56320 + 65536 : c
                        }
                    };
                r ? r(String.prototype, "codePointAt", {
                    value: a,
                    configurable: !0,
                    writable: !0
                }) : String["prototype"]["codePointAt"] = a
            }(),
            String["fromCodePoint"] || function (e) {
                var r = n
                    , a = function (n) {
                        for (var r = t, a = [], o = 0, i = "", c = 0, l = arguments.length; c !== l; ++c) {
                            var u = +arguments[c];
                            if (!(u < 1114111 && u >>> 0 === u))
                                throw RangeError("Invalid code point: " + u);
                            u <= 65535 ? o = a["push"](u) : (u -= 65536,
                                o = a.push(55296 + (u >> 10), u % 1024 + 56320)),
                                o >= 16383 && (i += e["apply"](null, a),
                                    a["length"] = 0)
                        }
                        return i + e["apply"](null, a)
                    };
                try {
                    Object["defineProperty"](String, "fromCodePoint", {
                        value: a,
                        configurable: !0,
                        writable: !0
                    })
                } catch (e) {
                    String.fromCodePoint = a
                }
            }(String["fromCharCode"]),
            CanvasRenderingContext2D["prototype"]["roundRect"] || (CanvasRenderingContext2D.prototype["roundRect"] = function (e, t, r, a, o) {
                var i = n
                    , c = new Array(4);
                if ("object" == typeof o)
                    switch (o["length"]) {
                        case 1:
                            c["fill"](o[0], 0, 4);
                            break;
                        case 2:
                            c["fill"](o[0], 0, 4),
                                c[1] = c[3] = o[1];
                            break;
                        case 3:
                            c[0] = o[0],
                                c[1] = c[3] = o[1],
                                c[2] = o[2];
                            break;
                        case 4:
                            c = o;
                            break;
                        default:
                            c.fill(0, 0, 4)
                    }
                this["beginPath"](),
                    this["moveTo"](e + c[0], t),
                    this["lineTo"](e + r - c[1], t),
                    this["quadraticCurveTo"](e + r, t, e + r, t + c[1]),
                    this["lineTo"](e + r, t + a - c[2]),
                    this["quadraticCurveTo"](e + r, t + a, e + r - c[2], t + a),
                    this["lineTo"](e + c[3], t + a),
                    this["quadraticCurveTo"](e, t + a, e, t + a - c[3]),
                    this["lineTo"](e, t + c[0]),
                    this["quadraticCurveTo"](e, t, e + c[0], t),
                    this.closePath()
            }
            );
        const $r =
            f.getMonth() === 12 && f.getDate() === 25
            , Gr = ["-20,-10", "0,-10"]
            , Qr = [
                [255, 0, 0], // red
                [0, 255, 0], // green
                [255, 255, 0], // yellow
                [255, 0, 255], // magenta
                [0, 0, 255] // blue
            ];
        $r && setInterval((function () {
            var e = n;
            if ("textwall" == W && "main" == H && !tt.disablecolour.checked)
                for (var t = 0; t < Gr["length"]; t++) {
                    var r = Gr[t]
                        , a = we["get"](r);
                    if (null != a && null != a["txt"]) {
                        for (var o = 0; o < 200; o++)
                            switch (a["txt"][o]) {
                                case "$":
                                case "^":
                                case ".":
                                case "'":
                                    a["clr"][o] = Qr[Math.floor(4 * Math["random"]())]
                            }
                        St(r, !1)
                    }
                }
        }
        ), 400);
        window.w.chunks = we;

        function advancedSplit(str, noSurrog, noComb, norm) {
            if (str && str.constructor == Array) return str.slice(0);
            var chars = [];
            var buffer = "";
            var surrogMode = false;
            var charMode = false;
            var combCount = 0;
            var combLimit = 15;
            for (var i = 0; i < str.length; i++) {
                var char = str[i];
                var code = char.charCodeAt();
                if (code >= 0xDC00 && code <= 0xDFFF) {
                    if (surrogMode) {
                        buffer += char;
                    } else {
                        buffer = "";
                        chars.push("?");
                    }
                    surrogMode = false;
                    combCount = 0;
                    continue;
                } else if (surrogMode) {
                    buffer = "";
                    chars.push("?");
                    surrogMode = false;
                    continue;
                }
                if (!noSurrog && code >= 0xD800 && code <= 0xDBFF) {
                    if (charMode) {
                        chars.push(buffer);
                    }
                    charMode = true;
                    surrogMode = true;
                    buffer = char;
                    continue;
                }
                if (!norm && ((code >= 0x0300 && code <= 0x036F) ||
                    (code >= 0x1DC0 && code <= 0x1DFF) ||
                    (code >= 0x20D0 && code <= 0x20FF) ||
                    (code >= 0xFE20 && code <= 0xFE2F))) {
                    if (!noComb && charMode && combCount < combLimit) {
                        buffer += char;
                        combCount++;
                    }
                    continue;
                } else {
                    if (charMode) {
                        chars.push(buffer);
                    }
                    combCount = 0;
                    charMode = true;
                    buffer = char;
                }
            }
            if (buffer) {
                chars.push(buffer);
            }
            return chars;
        }
        window.w.typeChar = writeChar;
        window.w.socket = {}
        Object.defineProperty(window.w, "socket", {
            get: function () { return a }
        });
        window.w.clipboard = {
            textarea: null,
            init: function () {
                var area = document.createElement("textarea");
                area.value = "";
                area.id = "textCopy";
                area.style.width = "1px";
                area.style.height = "1px";
                area.style.position = "absolute";
                area.style.left = "-1000px";
                area.style.top = "-1000px";
                document.body.appendChild(area);
                window.w.clipboard.textarea = area;
            },
            copy: function (string) {
                window.w.clipboard.textarea.value = string;
                window.w.clipboard.textarea.select();
                document.execCommand("copy");
                window.w.clipboard.textarea.value = "";
            }
        }
        window.w.clipboard.init();
        window.w.showChat = function (toggle) {
            const chat = document.getElementById("chat");
            if (!chat) return; // safety check

            if (toggle === undefined) {

                chat.classList.toggle("open");
                return;
            }

            const shouldShow = toggle === true || toggle === 1 || toggle === "1" || toggle === "true" || toggle === "show";

            if (shouldShow) {
                chat.classList.add("open");
            } else {
                chat.classList.remove("open");
            }
        };
        window.w.rerender = function () {
            for (let [key, chunk] of we) {
                St(key, !1);
                if (chunk["img"]) {
                    delete chunk["img"];
                }
                if (chunk["bmp"]) {
                    delete chunk["bmp"];
                }
            }

        }
        window.w.split = advancedSplit;
        window.w.chat = {};
        window.w.chat.send = aib;
        window.network = {};
        window.network.binary = Or;
        window.network.text = Rr;
        window.network.send = function (data) {
            a.send(window.network.binary(data))
        };
        window.network.wsUrl = "wss://" + location.host + "/ws";
        window.w.changeZoom = function (e, t) {
            console.warn("remember, this won't save!");
            var r = n;
            rt = e < 0 ? 0 : e > 10000 ? 10000 : e,
                at = Math.round(100 * rt) / 100,
                ot["value"] = 10 * at,
                t && ir(Math["round"](100 * at) + "% ", 1e3),
                kn()
        }
        window.w.changeColor = mr;
        window.w.showToast = ir;
        window.currentRegionSelection = null;
        window.RegionSelection = RegionSelection;
        function RegionSelection() {
            this.onSelectionEvents = [];
            this.tiled = false;
            this.startSelection = () => {
                if (Je) throw "There is already an active region selection";
                Je = true;
                window.currentRegionSelection = this;
                k.style.cursor = "crosshair";
            };
            this.onSelection = func => {
                this.onSelectionEvents.push(func);
            }
            this.getSelected = rr;
        }
        let cc = document.getElementById("customcolour");
        function hexToRGBArr(hex) {
            if (hex.startsWith("#")) hex = hex.slice(1);
            if (hex.length === 3) {
                hex = hex.split("").map(c => c + c).join("");
            }
            if (hex.length !== 6) {
                throw new Error("Invalid hex color");
            }
            let r = parseInt(hex.slice(0, 2), 16);
            let g = parseInt(hex.slice(2, 4), 16);
            let b = parseInt(hex.slice(4, 6), 16);
            return [r, g, b];
        }
        function gst(col, alpha = 0.2) {
            if (Array.isArray(col)) {
                return `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
            }

            if (typeof col === "string" && col.startsWith("#")) {
                let r = parseInt(col.slice(1, 3), 16);
                let g = parseInt(col.slice(3, 5), 16);
                let b = parseInt(col.slice(5, 7), 16);
                return `rgba(${r},${g},${b},${alpha})`;
            }

            return `rgba(255,255,255,${alpha})`;
        }

        function rgb888(rgb888) {
            // check if rgb888 is RGB888
            if (rgb888.length === 3 && rgb888.every(c => c >= 0 && c <= 255)) {
                return rgb888;
            }
        }
        function buildScript(url) {
            var scr = document.createElement("script");
            scr.src = url;

            return scr;
        }
        window.addEventListener("DOMContentLoaded", () => {
            cc.jscolor.onChange = function () {
                let hex = cc.jscolor.toHEXString();
                let rgbArr = hexToRGBArr(hex);
                mr(rgbArr);
            };
            /*
                        document.getElementById("wallthemeprotectcustom").jscolor.onChange = function () {
                            let hex = document.getElementById("wallthemeprotectcustom").jscolor.toHEXString();
                            window.network.send({theme: [nt["_theme"].checked, document.getElementById("wallthemecustom").jscolor.toHEXString(), hex]})
                        };
            
                        document.getElementById("wallthemecustom").jscolor.onChange = function () {
                            let hex = document.getElementById("wallthemecustom").jscolor.toHEXString();
                            window.network.send({theme: [nt["_theme"].checked, hex, document.getElementById("wallthemeprotectcustom").jscolor.toHEXString()]})
                        };*/

            let col = localStorage.getItem("col");
            if (col) {
                let rgb = col.split(",").map(c => parseInt(c.trim()));
                cc.jscolor.fromRGBA(...rgb, 0);
                mr(rgb, true);
            }
            var resp = fetch("/.ss").then(r => r.json());
            resp.then(scripts => {
                scripts.forEach(script => {
                    let scr = buildScript("/.ss/" + script);
                    document.body.appendChild(scr);
                });
            });
        });

        tt.rainbowMode.addEventListener("change", (e) => {
            localStorage.setItem("rainbowMode", e.target.value)
        });
        tt.hueSpeed.addEventListener("input", (e) => {
            localStorage.setItem("hueSpeed", e.target.value)
        });


    }("undefined" == typeof browser ? browser = {} : browser)
}("undefined" == typeof browser ? browser = {} : browser);
