/*jslint devel: true, bitwise: true*/
/*global AudioContext, alert, Uint8Array, sf2 */

(function () {
	"use strict";
	var BufferLength = 1024;
	
	// Utility function to load a SoundFont file from a URL using XMLHttpRequest.
	// The same origin policy will apply, as for all XHR requests.
	function loadSoundFont(url, success, error) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function (e) {
			success(new Uint8Array(this.response));
		};
		xhr.send();
	}
	
	function onAudioProcess(e, sf2data, key, count) {
		var out = e.outputBuffer.getChannelData(0),
			i,
			pos;
		
		for (i = 0; i < BufferLength; i = i + 1) {
			pos = count * BufferLength + i;
			if (pos < sf2data.sample[key].length) {
				out[i] = sf2data.sample[key][pos] / 44100;
			} else {
				out[i] = 0;
			}
		}
		count = count + 1;
	}
	
	function play(audioContext, sf2data, key) {
		var proc,
			bufferSource,
			count = 0;
		
		// 入力チャンネル数 = 1、出力チャンネル数 = 1
		proc = audioContext.createScriptProcessor(BufferLength, 1, 1);
		bufferSource = audioContext.createBufferSource();
		bufferSource.connect(proc);

		proc.onaudioprocess = (function (sf2data, key, count) {
			return function (e) {
				onAudioProcess(e, sf2data, key, count);
				count = count + 1;
			};
		}(sf2data, key, count));
		proc.connect(audioContext.destination);
		return proc;
	}
	
	function initKeys(audioContext, sf2data) {
		var keys = document.getElementsByClassName('key'),
			i,
			proc = null,
			mouseDownFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "skyblue";
					if (!proc) {
						proc = play(audioContext, sf2data, index);
					}
				};
			},
			mouseUpFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "";
					if (proc) {
						proc.disconnect();
						proc = null;
					}
				};
			},
			mouseOutFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "";
					if (proc) {
						proc.disconnect();
						proc = null;
					}
				};
			};

		for (i = 0; i < keys.length; i = i + 1) {
			keys[i].onmousedown = mouseDownFunc(i);
			keys[i].onmouseup = mouseUpFunc(i);
			keys[i].onmouseout = mouseOutFunc(i);
		}
	}
	
	function initElement(sf2data) {
		var div = document.getElementById('keyboard'),
			elem,
			i;
		
		div.innerHTML = "";
		
		for (i = 0; i < sf2data.sample.length - 1; i = i + 1) {
			elem = document.createElement('div');
			elem.className = "key";
			elem.innerHTML = sf2data.sampleHeader[i].sampleName;
			div.appendChild(elem);
		}
	}

	window.onload = function () {
		var audioContext;
		if (typeof AudioContext === "undefined") {
			return;
		}
		audioContext = new AudioContext();
		console.log(audioContext);
		
		// Load and parse a SoundFont file.
		loadSoundFont("sf2/Nyui_Candy.sf2", function (data) {
			var parser = new sf2.Parser(data),
				instrument;
			parser.parse();
			
			console.log(parser.getPresets());
			console.log(parser.getInstruments());
			console.log(parser);
			initElement(parser);
			initKeys(audioContext, parser);
		});
	};
}());
