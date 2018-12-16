'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
const isStar = true;

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return {
        subscriptions: new Map(),

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object}
         */
        on: function (event, context, handler) {
            return this._on(event, context, handler, undefined);
        },

        _on: function (event, context, handler, state) {
            let eventMap = obtainMapValue(this.subscriptions, event, () => new Map());
            let handlers = obtainMapValue(eventMap, context, () => []);

            handlers.push({
                func: handler,
                state: state
            });

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object}
         */
        off: function (event, context) {
            let offOne = e => {
                let eventMap = this.subscriptions.get(e);
                eventMap.delete(context);
            };

            let eventNs = event + '.';

            Array
                .from(this.subscriptions.keys())
                .filter(x => x === event || x.startsWith(eventNs))
                .forEach(x => offOne(x));

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object}
         */
        emit: function (event) {
            let emitOne = e => {
                let eventMap = this.subscriptions.get(e);
                if (!eventMap) {
                    return;
                }
                eventMap.forEach((value, key) => value.forEach(handler => {
                    let state = handler.state;
                    if (state) {
                        ++state.calls;

                        if (state.limit && state.calls > state.limit) {
                            return;
                        }
                        if (state.freq && (state.calls - 1) % state.freq !== 0) {
                            return;
                        }
                    }

                    handler.func.apply(key);
                }));
            };

            for (;;) {
                emitOne(event);
                let separatorIndex = event.lastIndexOf('.');
                if (separatorIndex < 0) {
                    break;
                }
                event = event.slice(0, separatorIndex);
            }

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object}
         */
        several: function (event, context, handler, times) {
            return this._on(event, context, handler, {
                calls: 0,
                limit: times
            });
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object}
         */
        through: function (event, context, handler, frequency) {
            return this._on(event, context, handler, {
                calls: 0,
                freq: frequency
            });
        }
    };
}

/**
 * Получает значение из Map. Если ключа нет - добавляет значение.
 * @star
 * @param {Map} map
 * @param {Object} key
 * @param {Function} valueFactory
 * @returns {Object}
 */
function obtainMapValue(map, key, valueFactory) {
    if (!map.has(key)) {
        let value = valueFactory();
        map.set(key, value);

        return value;
    }

    return map.get(key);
}

module.exports = {
    getEmitter,

    isStar
};
