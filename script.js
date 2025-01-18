      // Read file
      var file;
      var fileName;
      document.getElementById("fileInput").addEventListener("change", function(event) {
        file = event.target.files[0];
        fileName = file.name;
        if (file) {
          var reader = new FileReader();
          reader.readAsText(file);
          reader.onload = function(a) {
            file = a.target.result;
            decodeAndDisplay(file);
          }
        }
      });

      // Decode algorithm
      function decode(encodedString) {
        var decodedString = "";
        for (var i = 0; i < encodedString.length; i++) {
          var charCode = encodedString.charCodeAt(i) - (i * 5 % 33 + 1);
          decodedString += String.fromCodePoint(charCode);
        }
        return decodedString;
      }

      // Decode and display the file
      function decodeAndDisplay(encodedString) {
        var decodedString = decode(encodedString);
        document.getElementById("decodedContent").textContent = decodedString;
        document.getElementById("copyButton").style.display = "block";
        document.getElementById("compileButton").style.display = "block";
        document.getElementById("toggleHardcoreButton").style.display = "block";
      }

      // Copy text to clipboard
      document.getElementById("copyButton").addEventListener("click", function() {
        var decodedContent = document.getElementById("decodedContent").textContent;
        navigator.clipboard.writeText(decodedContent).then(function() {
          alert("Texto copiado al portapapeles");
        }, function(err) {
          alert("Error al copiar el texto: " + err);
        });
      });

      // Encode algorithm
      function encode(decodedString) {
        var encodedString = "";
        for (var a = 0, b = decodedString.length; a < b; ) {
          var c = a++;
          var characterCode = decodedString.charCodeAt(c) + (c * 5 % 33 + 1);
          encodedString += String.fromCodePoint(characterCode);
        }
        return encodedString;
      }

      // Download new file
      var newFile;
      function download() {
        if (newFile) {
          var blob = new Blob([newFile], { type: "text/plain" });
          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }

      // Event listener for the compile button
      document.getElementById("compileButton").addEventListener("click", function() {
        var decodedContent = document.getElementById("decodedContent").textContent;
        newFile = encode(decodedContent);
        document.getElementById("downloadButton").style.display = "block";
      });

      // Event listener for the download button
      document.getElementById("downloadButton").addEventListener("click", download);

      // Event listener for the load button
      document.getElementById("loadButton").addEventListener("click", function() {
        document.getElementById("fileInput").click();
      });

      // Toggle hardcore mode, cheats, and gamemode
      document.getElementById("toggleHardcoreButton").addEventListener("click", function() {
        var decodedContent = document.getElementById("decodedContent").textContent;
        var updatedContent = decodedContent
          .replace('"hardcore":true', '"hardcore":false')
          .replace('"cheats":false', '"cheats":true')
          .replace('"gamemode":3', '"gamemode":1');
        document.getElementById("decodedContent").textContent = updatedContent;
      });