/*jslint nomen : true*/
/*jslint devel:true*/
/*jslint browser:true*/
/*global _  */

/**
 The MIT License (MIT)

 Copyright (c) 2013 ferronrsmith

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.s
 */
(function (window) {
    "use strict";
    var debug = true,
        self = this,
        $$logger,
        ArrayProto = Array.prototype,
        nativeForEach = ArrayProto.forEach,
        slice = ArrayProto.slice,
        breaker = {};


    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) return;
                }
            }
        }
    };

    // Extend a given object with all the properties in passed-in object(s).
    var extend = function(obj) {
        each(slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    if(source.hasOwnProperty(prop)){
                        obj[prop] = source[prop];
                    }
                }
            }
        });
        return obj;
    };

    function formatError(arg) {
        if (arg instanceof Error) {
            if (arg.stack) {
                arg = (arg.message && arg.stack.indexOf(arg.message) === -1)
                    ? 'Error: ' + arg.message + '\n' + arg.stack
                    : arg.stack;
            } else if (arg.sourceURL) {
                arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
            }
        }
        return arg;
    }

    function consoleLog(type) {
        var console = window.console || {},
            logFn = console[type] || console.log || [];

        if (logFn.apply) {
            return function () {
                var args = [];
                each(arguments, function (arg) {
                    args.push(formatError(arg));
                });
                return logFn.apply(console, args);
            };
        }

        // we are IE which either doesn't have window.console => this is noop and we do nothing,
        // or we are IE where console.log doesn't have apply so we log at least first 2 args
        return function (arg1, arg2) {
            logFn(arg1, arg2);
        };
    }


    $$logger = {
        /**
         * @ngdoc method
         * @name ng.$log#log
         * @methodOf ng.$log
         *
         * @description
         * Write a log message
         */
        log: consoleLog('log'),

        /**
         * @ngdoc method
         * @name ng.$log#info
         * @methodOf ng.$log
         *
         * @description
         * Write an information message
         */
        info: consoleLog('info'),

        /**
         * @ngdoc method
         * @name ng.$log#warn
         * @methodOf ng.$log
         *
         * @description
         * Write a warning message
         */
        warn: consoleLog('warn'),

        /**
         * @ngdoc method
         * @name ng.$log#error
         * @methodOf ng.$log
         *
         * @description
         * Write an error message
         */
        error: consoleLog('error'),

        /**
         * @ngdoc method
         * @name ng.$log#debug
         * @methodOf ng.$log
         *
         * @description
         * Write a debug message
         */


        debug: (function () {
            var fn = consoleLog('debug');
            return function () {
                if (debug) {
                    fn.apply(self, arguments);
                }
            };
        }()),

        /***
         *
         * @param {boolean} flag enable or disable debug level messages
         * @returns {*} current value if used as getter or itself (chaining) if used as setter
         */
        debugEnabled: function (flag) {
            debug = flag;
            return this;
        }
    };

    // override the current logger
    extend(window, $$logger);

    // added a simple method to allow the injection of the logger into your framework
    extend(window, {
        injectLogger: function (obj) {
            if (obj !== undefined || obj !== null) {
                extend(obj, $$logger);
            }
        },
        appendLogger: function () {
            return $$logger;
        }
    });

}(window));
