/*

 Copyright (c) 2013 David Gundersen

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions
 of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

namespace("jssynth.MOD");
namespace("jssynth.player");

jssynth.player.NoteData = {};

jssynth.player.NoteData.MOD_PERIOD_TABLE = {
    PERIODS: [
        27392,25856,24384,23040,21696,20480,19328,18240,17216,16256,15360,14496,
        13696,12928,12192,11520,10848,10240, 9664, 9120, 8608, 8128, 7680, 7248,
        6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3624,
        3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1812,
        1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016,  960,  906,
        856,  808,  762,  720,  678,  640,  604,  570,  538,  508,  480,  453,
        428,  404,  381,  360,  339,  320,  302,  285,  269,  254,  240,  226,
        214,  202,  190,  180,  170,  160,  151,  143,  135,  127,  120,  113,
        107,  101,   95,   90,   85,   80,   75,   71,   67,   63,   60,   56
    ],
    NOTE_NAMES: [
        "C-0", "C#0", "D-0", "D#0", "E-0", "F-0", "F#0", "G-0", "G#0", "A-0", "A#0", "B-0",
        "C-1", "C#1", "D-1", "D#1", "E-1", "F-1", "F#1", "G-1", "G#1", "A-1", "A#1", "B-1",
        "C-2", "C#2", "D-2", "D#2", "E-2", "F-2", "F#2", "G-2", "G#2", "A-2", "A#2", "B-2",
        "C-3", "C#3", "D-3", "D#3", "E-3", "F-3", "F#3", "G-3", "G#3", "A-3", "A#3", "B-3",
        "C-4", "C#4", "D-4", "D#4", "E-4", "F-4", "F#4", "G-4", "G#4", "A-4", "A#4", "B-4",
        "C-5", "C#5", "D-5", "D#5", "E-5", "F-5", "F#5", "G-5", "G#5", "A-5", "A#5", "B-5",
        "C-6", "C#6", "D-6", "D#6", "E-6", "F-6", "F#6", "G-6", "G#6", "A-6", "A#6", "B-6",
        "C-7", "C#7", "D-7", "D#7", "E-7", "F-7", "F#7", "G-7", "G#7", "A-7", "A#7", "B-7",
        "C-8", "C#8", "D-8", "D#8", "E-8", "F-8", "F#8", "G-8", "G#8", "A-8", "A#8", "B-8"
    ],
    getNote : function (period) {
        var i = 0;
        if (period <= 0) {
            return -1;
        }
        for (i = 0; i < jssynth.player.NoteData.MOD_PERIOD_TABLE.PERIODS.length - 1; i++) {
            var p = jssynth.player.NoteData.MOD_PERIOD_TABLE.PERIODS[i];
            var p1 = jssynth.player.NoteData.MOD_PERIOD_TABLE.PERIODS[i+1];
            if (Math.abs(p - period) < Math.abs(p1 - period)) {
                return i;
            }
        }
        return -1;
    },
    getPeriod : function(note) {
        return jssynth.player.NoteData.MOD_PERIOD_TABLE.PERIODS[note] || -1;
    },
    getName : function(note) {
        if (note == 254) {
            return "oFF";
        } else {
            return jssynth.player.NoteData.MOD_PERIOD_TABLE.NOTE_NAMES[note] || "---";
        }
    }

};

