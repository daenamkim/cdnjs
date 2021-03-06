/**
 * @license  Highcharts JS v6.0.4 (2017-12-15)
 *
 * Indicator series type for Highstock
 *
 * (c) 2010-2017 Pawel Fus, Sebastian Bochan
 *
 * License: www.highcharts.com/license
 */
'use strict';
(function(factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function(Highcharts) {
    (function(H) {

        var each = H.each,
            error = H.error,
            Series = H.Series,
            isArray = H.isArray,
            addEvent = H.addEvent,
            seriesType = H.seriesType;

        /**
         * The SMA series type.
         *
         * @constructor seriesTypes.sma
         * @augments seriesTypes.line
         */
        seriesType('sma', 'line',
            /**
             * Simple moving average indicator (SMA). This series requires `linkedTo` option to be set.
             * 
             * @extends {plotOptions.line}
             * @product highstock
             * @sample {highstock} stock/indicators/sma Simple moving average indicator
             * @since 6.0.0
             * @excluding
             * 			allAreas,colorAxis,compare,compareBase,joinBy,keys,stacking,
             * 			showInNavigator,navigatorOptions,pointInterval,pointIntervalUnit,
             *			pointPlacement,pointRange,pointStart,joinBy
             * @optionparent plotOptions.sma
             */
            {
                /**
                 * The series name.
                 * 
                 * @type {String}
                 * @since 6.0.0
                 * @product highstock
                 */
                name: 'SMA (14)',
                tooltip: {
                    /**
                     * Number of decimals in indicator series.
                     * 
                     * @type {Number}
                     * @since 6.0.0
                     * @product highstock
                     */
                    valueDecimals: 4
                },
                /**
                 * The main series ID that indicator will be based on. Required for this indicator.
                 * 
                 * @type {String}
                 * @since 6.0.0
                 * @product highstock
                 */
                linkedTo: undefined,
                params: {
                    /**
                     * The point index which indicator calculations will base.
                     * For example using OHLC data, index=2 means the indicator will be calculated using Low values.
                     * 
                     * @type {Number}
                     * @since 6.0.0
                     * @product highstock
                     */
                    index: 0,
                    /**
                     * The base period for indicator calculations.
                     * 
                     * @type {Number}
                     * @since 6.0.0
                     * @product highstock
                     */
                    period: 14
                }
            }, /** @lends Highcharts.Series.prototype */ {
                bindTo: {
                    series: true,
                    eventName: 'updatedData'
                },
                calculateOn: 'init',
                init: function(chart, options) {
                    var indicator = this;

                    Series.prototype.init.call(
                        indicator,
                        chart,
                        options
                    );

                    // Make sure we find series which is a base for an indicator
                    chart.linkSeries();

                    indicator.dataEventsToUnbind = [];

                    function recalculateValues() {
                        var processedData = indicator.getValues(
                            indicator.linkedParent,
                            indicator.options.params
                        ) || {
                            values: [],
                            xData: [],
                            yData: []
                        };

                        indicator.xData = processedData.xData;
                        indicator.yData = processedData.yData;
                        indicator.options.data = processedData.values;

                        //	Removal of processedXData property is required because on first translate processedXData array is empty
                        if (indicator.bindTo.series === false) {
                            delete indicator.processedXData;

                            indicator.isDirty = true;
                            indicator.redraw();
                        }
                        indicator.isDirtyData = false;
                    }

                    if (!indicator.linkedParent) {
                        return error(
                            'Series ' +
                            indicator.options.linkedTo +
                            ' not found! Check `linkedTo`.'
                        );
                    }

                    indicator.dataEventsToUnbind.push(
                        addEvent(
                            indicator.bindTo.series ?
                            indicator.linkedParent : indicator.linkedParent.xAxis,
                            indicator.bindTo.eventName,
                            recalculateValues
                        )
                    );

                    if (indicator.calculateOn === 'init') {
                        recalculateValues();
                    } else {
                        var unbinder = addEvent(
                            indicator.chart,
                            indicator.calculateOn,
                            function() {
                                recalculateValues();
                                // Call this just once, on init
                                unbinder();
                            }
                        );
                    }

                    return indicator;
                },
                getValues: function(series, params) {
                    var period = params.period,
                        xVal = series.xData,
                        yVal = series.yData,
                        yValLen = yVal.length,
                        range = 0,
                        sum = 0,
                        SMA = [],
                        xData = [],
                        yData = [],
                        index = -1,
                        i,
                        SMAPoint;

                    if (xVal.length < period) {
                        return false;
                    }

                    // Switch index for OHLC / Candlestick / Arearange
                    if (isArray(yVal[0])) {
                        index = params.index ? params.index : 0;
                    }

                    // Accumulate first N-points
                    while (range < period - 1) {
                        sum += index < 0 ? yVal[range] : yVal[range][index];
                        range++;
                    }

                    // Calculate value one-by-one for each period in visible data
                    for (i = range; i < yValLen; i++) {
                        sum += index < 0 ? yVal[i] : yVal[i][index];

                        SMAPoint = [xVal[i], sum / period];
                        SMA.push(SMAPoint);
                        xData.push(SMAPoint[0]);
                        yData.push(SMAPoint[1]);

                        sum -= index < 0 ? yVal[i - range] : yVal[i - range][index];
                    }

                    return {
                        values: SMA,
                        xData: xData,
                        yData: yData
                    };
                },
                destroy: function() {
                    each(this.dataEventsToUnbind, function(unbinder) {
                        unbinder();
                    });
                    Series.prototype.destroy.call(this);
                }
            });

        /**
         * A `SMA` series. If the [type](#series.sma.type) option is not
         * specified, it is inherited from [chart.type](#chart.type).
         * 
         * For options that apply to multiple series, it is recommended to add
         * them to the [plotOptions.series](#plotOptions.series) options structure.
         * To apply to all series of this specific type, apply it to [plotOptions.
         * sma](#plotOptions.sma).
         * 
         * @type {Object}
         * @since 6.0.0
         * @extends series,plotOptions.sma
         * @excluding data,dataParser,dataURL
         * @product highstock
         * @apioption series.sma
         */


        /**
         * An array of data points for the series. For the `SMA` series type,
         * points are calculated dynamically.
         * 
         * @type {Array<Object|Array>}
         * @since 6.0.0
         * @extends series.line.data
         * @product highstock
         * @apioption series.sma.data
         */

    }(Highcharts));
}));
