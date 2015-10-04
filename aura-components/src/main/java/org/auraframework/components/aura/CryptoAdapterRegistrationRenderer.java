/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.auraframework.components.aura;

import org.auraframework.Aura;
import org.auraframework.def.Renderer;
import org.auraframework.instance.BaseComponent;
import org.auraframework.throwable.quickfix.QuickFixException;

import java.io.IOException;

/**
 * Renders client side registration and key retrieval of CryptoAdapter for auraStorage:crypto
 */
public class CryptoAdapterRegistrationRenderer implements Renderer {
    @Override
    public void render(BaseComponent<?, ?> component, Appendable appendable) throws IOException, QuickFixException {
        String encryptionKeyUrl = Aura.getConfigAdapter().getEncryptionKeyURL();
        appendable
            .append("<script>\n")
            .append("(function(){\n")
            .append("  CryptoAdapter.register();\n")
            .append("  if ($A.storageService.isRegisteredAdapter(CryptoAdapter.NAME)) {\n")
            .append("    var url = '").append(encryptionKeyUrl).append("';\n")
            .append("    var request = new XMLHttpRequest();\n")
            .append("    request.open('GET', url, true);\n")
            .append("    request.addEventListener('load', function (event) {\n")
            .append("      var key = this.responseText;\n")
            .append("      if (key && (key.length == 16 || key.length == 32)) {\n")
            .append("        var buffer = new ArrayBuffer(key.length);\n")
            .append("        var view = new Uint8Array(buffer);\n")
            .append("        view.set(key);\n")
            .append("        CryptoAdapter.setKey(buffer);\n")
            .append("      } else {\n")
            .append("        CryptoAdapter.setKey('');\n")
            .append("      }\n")
            .append("    });\n")
            .append("    request.send();\n")
            .append("  }\n")
            .append("}());\n")
            .append("</script>\n");
    }
}
