/*jslint devel: true, bitwise: true*/
/*global AudioContext, alert*/

(function () {
	"use strict";
	var oscillator = null,
		envelope = null;    // the envelope for the single oscillator

	function onMIDIReject(err) {
		//alert("The MIDI system failed to start.  You're gonna have a bad time.");
	}

	function freqFromNote(note) {
		return 440 * Math.pow(2, (note - 69) / 12);
	}

	function midiMessageEventHandler(event) {
		var noteOn,
			noteOff,
			attack = 0.05, // attack speed
			release = 0.05, // release speed
			portamento = 0.05, // portamento/glide speed
			activeNotes = []; // the stack of actively-pressed keys

		noteOn = function (noteNumber) {
			activeNotes.push(noteNumber);
			oscillator.frequency.cancelScheduledValues(0);
			oscillator.frequency.setTargetAtTime(freqFromNote(noteNumber), 0, portamento);
			envelope.gain.cancelScheduledValues(0);
			envelope.gain.setTargetAtTime(1.0, 0, attack);
		};
		noteOff = function (noteNumber) {
			var position = activeNotes.indexOf(noteNumber);
			if (position !== -1) {
				activeNotes.splice(position, 1);
			}
			if (activeNotes.length === 0) {  // shut off the envelope
				envelope.gain.cancelScheduledValues(0);
				envelope.gain.setTargetAtTime(0.0, 0, release);
			} else {
				oscillator.frequency.cancelScheduledValues(0);
				oscillator.frequency.setTargetAtTime(freqFromNote(activeNotes[activeNotes.length - 1]), 0, portamento);
			}
		};

		// Mask off the lower nibble (MIDI channel, which we don't care about)
		switch (event.data[0] & 0xf0) {
		case 0x90:
			if (event.data[2] !== 0) {  // if velocity != 0, this is a note-on message
				noteOn(event.data[1]);
				return;
			}
			break;
		// if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
		case 0x80:
			noteOff(event.data[1]);
			return;
		}
	}

	/**
	 * @param midi the MIDIAccess object.
	 */
	function onMIDIInit(access) {
		var midiins = [],
			midiouts = [],
			inputs = access.inputs.values(),
			outputs = access.outputs.values(),
			i,
			input,
			inDiv = document.getElementById('midiin');
			
		for (i = inputs.next(); !i.done; i = inputs.next()) {
			i.value.onmidimessage = midiMessageEventHandler;
			midiins.push(i.value);
		}
		for (i = outputs.next(); !i.done; i = outputs.next()) {
			midiouts.push(i.value);
		}
		for (i = 0; i < midiins.length; i = i + 1) {
			input = midiins[i];
			if (i === 0) {
				inDiv.innerHTML = input.name;
			} else {
				inDiv.innerHTML = inDiv.innerHTML + ", " + input.name;
			}
		}
	}
	
	function initKeys() {
		var keys = document.getElementsByClassName('key'),
			i,
			mouseDownFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "skyblue";
					midiMessageEventHandler({
						data : [0x90, 60 + index]
					});
				};
			},
			mouseUpFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "";
					midiMessageEventHandler({
						data : [0x80, 60 + index]
					});
				};
			},
			mouseOutFunc = function (index) {
				return function (evt) {
					evt.target.style.background = "";
					midiMessageEventHandler({
						data : [0x80, 60 + index]
					});
				};
			};

		for (i = 0; i < keys.length; i = i + 1) {
			keys[i].onmousedown = mouseDownFunc(i);
			keys[i].onmouseup = mouseUpFunc(i);
			keys[i].onmouseout = mouseOutFunc(i);
		}
	}

	window.onload = function () {
		var context, // the Web Audio "context" object
			filter;
		
		// patch up prefixes
		window.AudioContext = window.AudioContext || window.webkitAudioContext;

		context = new AudioContext();
		if (navigator.requestMIDIAccess) {
			navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);
		} else {
			alert("No MIDI support present in your browser.  You're gonna have a bad time.");
		}

		// set up the basic oscillator chain, muted to begin with.
		oscillator = context.createOscillator();
		oscillator.frequency.setValueAtTime(110, 0);
		filter = context.createBiquadFilter();
		oscillator.connect(filter);
		envelope = context.createGain();
		filter.connect(envelope);
		envelope.connect(context.destination);
		envelope.gain.value = 0.0;  // Mute the sound
		oscillator.start(0);  // Go ahead and start up the oscillator
		
		initKeys();
	};
}());
