sap.ui.define(["sap/ui/core/UIComponent"], function (BaseComponent) {
  "use strict";

  /**
   * @namespace be.nmbs.plugins.wzanalyticspluginshellapp
   */
  const Component = BaseComponent.extend("be.nmbs.plugins.wzanalyticspluginshellapp.Component", {
    metadata: {
      manifest: "json"
    },
    init: async function _init() {
      // call the base component's init function
      BaseComponent.prototype.init.call(this);
      //@ts-ignore

      try {
        const oModel = new sap.ui.model.odata.v4.ODataModel({
          serviceUrl: sap.ui.require.toUrl("be/nmbs/plugins/wzanalyticspluginshellapp") + "/odata/v4/catalog/",
          synchronizationMode: "None",
          groupId: "$direct"
        });
        const workzoneId = await oModel.bindProperty("/getWorkzoneID()").requestValue();
        console.log(workzoneId);
        //const workzoneId = "35"

        var _paq = window._paq = window._paq || [];
        _paq.push(["setDomains", ["*.hana.ondemand.com"]]);
        _paq.push(['enableLinkTracking']);
        _paq.push(['setDocumentTitle', document.title]);
        _paq.push(['setCustomUrl', document.URL]);
        _paq.push(['trackPageView']);
        const url = sap.ui.require.toUrl("be/nmbs/plugins/wzanalyticspluginshellapp") + "/Piwik/";
        _paq.push(['setTrackerUrl', url + 'piwik.php']);
        _paq.push(['setSiteId', workzoneId]);
        var d = document,
          g = d.createElement('script'),
          s = d.getElementsByTagName('script')[0];
        g.type = 'text/javascript';
        g.async = true;
        g.defer = true;
        g.src = url + "piwik.js";
        //@ts-ignore
        s.parentNode.insertBefore(g, s);
        var currentUrl = location.href;
        window.addEventListener("hashchange", () => {
          _paq.push(['setReferrerUrl', currentUrl]);
          currentUrl = document.URL;
          _paq.push(['setCustomUrl', document.URL]);
          _paq.push(['setDocumentTitle', this.getHash()]);
          _paq.push(['trackPageView']);

          // var content = document.getElementById('content');
          _paq.push(['MediaAnalytics::scanForMedia', document]);
          _paq.push(['FormAnalytics::scanForForms', document]);
          _paq.push(['trackContentImpressionsWithinNode', document]);
          _paq.push(['enableLinkTracking']);
          //@ts-ignore
          piwik_log(this.getHash(), workzoneId, url + 'piwik.php');
        }, false);
      } catch (error) {
        console.warn("error");
        console.error(error);
      }
    },
    /**
     * getHash
     */
    getHash: function _getHash() {
      let newHash = location.hash;
      if (newHash.indexOf("?") > -1) {
        newHash = location.hash.substr(0, location.hash.indexOf("?"));
      }
      newHash = newHash.indexOf("&") > -1 ? newHash.substr(0, newHash.indexOf("&")) : newHash;
      return newHash;
    }
  });
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
