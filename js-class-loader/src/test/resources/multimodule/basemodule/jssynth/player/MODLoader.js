namespace("jssynth.player");

jssynth.player.MODLoader = {};

jssynth.player.MODLoader.MODTypes = {
};

jssynth.player.MODLoader.readMODfile = function (data) {
    song.effectMap = jssynth.player.Effects.MOD_EFFECT_MAP;
    note.note = (period === 0) ? -1 : jssynth.player.NoteData.MOD_PERIOD_TABLE.getNote(period);
};
