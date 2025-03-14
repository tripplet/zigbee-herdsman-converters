import * as exposes from "../lib/exposes";
import * as tuya from "../lib/tuya";
import type {DefinitionWithExtend, KeyValueNumberString, Tz} from "../lib/types";
import * as utils from "../lib/utils";

const e = exposes.presets;
const ea = exposes.access;
interface KeyValueStringEnum {
    [s: string]: tuya.Enum;
}

export const definitions: DefinitionWithExtend[] = [
    {
        fingerprint: tuya.fingerprint("TS0601", ["_TZE284_k6rdmisz", "_TZE204_k6rdmisz"]),
        model: "TR-M2Z",
        vendor: "MAZDA",
        description: "Thermostatic radiator valve",
        fromZigbee: [tuya.fz.datapoints],
        toZigbee: [tuya.tz.datapoints],
        onEvent: tuya.onEventSetTime,
        configure: tuya.configureMagicPacket,
        exposes: [
            e.battery(),
            e.child_lock(),
            e.window_detection_bool(),
            tuya.exposes.frostProtection(),
            e.binary("alarm_switch", ea.STATE, "ON", "OFF").withDescription("Thermostat in error state"),
            e.comfort_temperature().withValueMin(5).withValueMax(35).withDescription("Comfort mode temperature"),
            e.eco_temperature().withValueMin(5).withValueMax(35).withDescription("Eco mode temperature"),
            e.holiday_temperature().withValueMin(5).withValueMax(35).withDescription("Holiday mode temperature"),
            e
                .numeric("temperature_sensitivity", ea.STATE_SET)
                .withUnit("°C")
                .withValueMin(0.5)
                .withValueMax(5)
                .withValueStep(0.5)
                .withDescription("Temperature sensitivity"),
            e
                .climate()
                .withLocalTemperature(ea.STATE)
                .withSetpoint("current_heating_setpoint", 5, 35, 0.5, ea.STATE_SET)
                .withPreset(["manual", "schedule", "eco", "comfort", "frost_protection", "holiday", "off"])
                .withRunningState(["idle", "heat"], ea.STATE)
                .withSystemMode(["off", "heat"], ea.STATE, "Only for Homeassistant")
                .withLocalTemperatureCalibration(-9.5, 9.5, 0.5, ea.STATE_SET),
            ...tuya.exposes.scheduleAllDays(ea.STATE_SET, "HH:MM/C HH:MM/C HH:MM/C HH:MM/C HH:MM/C HH:MM/C"),
        ],
        meta: {
            tuyaDatapoints: [
                [
                    2,
                    "preset",
                    {
                        from: (v: string) => {
                            utils.assertNumber(v, "system_mode");
                            const presetLookup: KeyValueNumberString = {
                                0: "manual",
                                1: "schedule",
                                2: "eco",
                                3: "comfort",
                                4: "frost_protection",
                                5: "holiday",
                                6: "off",
                            };
                            return presetLookup[v];
                        },
                        to: (v: string, meta: Tz.Meta) => {
                            const lookup: KeyValueStringEnum = {
                                manual: tuya.enum(0),
                                schedule: tuya.enum(1),
                                eco: tuya.enum(2),
                                comfort: tuya.enum(3),
                                frost_protection: tuya.enum(4),
                                holiday: tuya.enum(5),
                            };
                            // Update system_mode when preset changes
                            if (meta) {
                                meta.state.system_mode = v === "off" ? "off" : "heat";
                            }
                            return utils.getFromLookup(v, lookup);
                        },
                    },
                ],
                [
                    2,
                    "system_mode",
                    {
                        from: (v: tuya.Enum) => {
                            return v === tuya.enum(6) ? "off" : "heat";
                        },
                        to: (v: string, meta: Tz.Meta) => {
                            if (meta) {
                                const currentPreset = meta.state.preset;
                                if (v === "heat" && currentPreset === "off") {
                                    meta.state.preset = "manual";
                                    return tuya.enum(0);
                                }
                                if (v === "off") {
                                    meta.state.preset = "off";
                                    return tuya.enum(6);
                                }
                            }
                            return v === "off" ? tuya.enum(6) : tuya.enum(1);
                        },
                    },
                ],
                [3, "running_state", tuya.valueConverterBasic.lookup({heat: 1, idle: 0})],
                [4, "current_heating_setpoint", tuya.valueConverter.divideBy10],
                [5, "local_temperature", tuya.valueConverter.divideBy10],
                [6, "battery", tuya.valueConverter.raw],
                [7, "child_lock", tuya.valueConverter.lockUnlock],
                [103, "eco_temperature", tuya.valueConverter.divideBy10],
                [104, "comfort_temperature", tuya.valueConverter.divideBy10],
                [105, "frost_temperature", tuya.valueConverter.divideBy10],
                [102, "temperature_sensitivity", tuya.valueConverter.divideBy10],
                [21, "holiday_temperature", tuya.valueConverter.divideBy10],
                [15, "window", tuya.valueConverterBasic.lookup({OPEN: 1, CLOSE: 0})],
                [14, "window_detection", tuya.valueConverter.onOff],
                [35, "alarm_switch", tuya.valueConverter.onOff],
                [36, "frost_protection", tuya.valueConverter.onOff],
                [28, "schedule_monday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(1, 6)],
                [29, "schedule_tuesday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(2, 6)],
                [30, "schedule_wednesday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(3, 6)],
                [31, "schedule_thursday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(4, 6)],
                [32, "schedule_friday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(5, 6)],
                [33, "schedule_saturday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(6, 6)],
                [34, "schedule_sunday", tuya.valueConverter.thermostatScheduleDayMultiDPWithDayNumber(7, 6)],
                [47, "local_temperature_calibration", tuya.valueConverter.localTempCalibration1],
            ],
        },
    },
];
