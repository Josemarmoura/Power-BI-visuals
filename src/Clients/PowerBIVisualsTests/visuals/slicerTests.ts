/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../_references.ts"/>

module powerbitests {
    import Slicer = powerbi.visuals.Slicer;
    import DataViewTransform = powerbi.data.DataViewTransform;
    import ValueType = powerbi.ValueType;
    import SelectionId = powerbi.visuals.SelectionId;

    var SelectAllTextKey = "Select All";

    powerbitests.mocks.setLocale();

    var dataViewMetadata: powerbi.DataViewMetadata = {
        columns: [
            { displayName: "Fruit", properties: { "Category": true }, type: ValueType.fromDescriptor({ text: true }) },
            { displayName: "Price", isMeasure: true }]
    };

    var dataViewCategorical = {
        categories: [{
            source: dataViewMetadata.columns[0],
            values: ["Apple", "Orange", "Kiwi", "Grapes", "Banana"],
            identity: [
                mocks.dataViewScopeIdentity("Apple"),
                mocks.dataViewScopeIdentity("Orange"),
                mocks.dataViewScopeIdentity("Kiwi"),
                mocks.dataViewScopeIdentity("Grapes"),
                mocks.dataViewScopeIdentity("Banana")
            ]
        }],
        values: DataViewTransform.createValueColumns([{
            source: dataViewMetadata.columns[1],
            values: [20, 10, 30, 15, 12]
        }])
    };

    var dataView: powerbi.DataView = {
        metadata: dataViewMetadata,
        categorical: dataViewCategorical
    };

    var interactiveDataViewOptions: powerbi.VisualDataChangedOptions = {
        dataViews: [dataView]
    };

    describe("Slicer", () => {
        it("Slicer_registered_capabilities", () => {
            expect(powerbi.visuals.visualPluginFactory.create().getPlugin("slicer").capabilities).toBe(powerbi.visuals.slicerCapabilities);
        });

        it("Capabilities should include dataViewMapping", () => {
            expect(powerbi.visuals.slicerCapabilities.dataViewMappings).toBeDefined();
            expect(powerbi.visuals.slicerCapabilities.dataViewMappings.length).toBe(1);
        });

        it("Capabilities should have condition", () => {
            expect(powerbi.visuals.slicerCapabilities.dataViewMappings[0].conditions.length).toBe(1);
            expect(powerbi.visuals.slicerCapabilities.dataViewMappings[0].conditions[0][powerbi.visuals.slicerCapabilities.dataRoles[0].name].max).toBe(1);
        });

        it("Capabilities should include dataRoles", () => {
            expect(powerbi.visuals.slicerCapabilities.dataRoles).toBeDefined();
            expect(powerbi.visuals.slicerCapabilities.dataRoles.length).toBe(1);
        });

        it("Capabilities should suppressDefaultTitle", () => {
            expect(powerbi.visuals.slicerCapabilities.suppressDefaultTitle).toBe(true);
        });

        it("Filter property should match calculated", () => {
            expect(powerbi.data.DataViewObjectDescriptors.findFilterOutput(powerbi.visuals.slicerCapabilities.objects)).toEqual(powerbi.visuals.slicerProps.filterPropertyIdentifier);
        });

        it("Sort should be default so the sort UI shows", () => {
            expect(powerbi.visuals.slicerCapabilities.sorting.custom).not.toBeDefined();
            expect(powerbi.visuals.slicerCapabilities.sorting.default).toBeDefined();
        });
    });

    describe("Slicer DOM tests", () => {
        var v: Slicer;
        var element: JQuery;

        beforeEach(() => {
            element = powerbitests.helpers.testDom("200", "300");
            v = <Slicer> powerbi.visuals.visualPluginFactory.create().getPlugin("slicer").create();

            v.init({
                element: element,
                host: mocks.createVisualHostServices(),
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
        }
            });

        });

        it("Slicer DOM Validation", (done) => {
            spyOn(powerbi.visuals.valueFormatter, "format").and.callThrough();

            v.onDataChanged(interactiveDataViewOptions);
            setTimeout(() => {
                expect($(".slicerContainer")).toBeInDOM();
                expect($(".slicerContainer .headerText")).toBeInDOM();
                expect($(".slicerContainer .slicerHeader .clear")).toBeInDOM();
                expect($(".slicerContainer .slicerBody")).toBeInDOM();
                expect($(".slicerContainer .slicerBody .row .slicerText")).toBeInDOM();
                expect($(".slicerText").length).toBe(6);
                expect($(".slicerText").first().text()).toBe(SelectAllTextKey);
                expect($(".slicerText").last().text()).toBe("Banana");

                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Apple", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Orange", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Kiwi", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Grapes", undefined);
                expect(powerbi.visuals.valueFormatter.format).toHaveBeenCalledWith("Banana", undefined);

                // Subsequent update
                var dataView2: powerbi.DataView = {
                    metadata: dataViewMetadata,
                    categorical: {
                        categories: [{
                            source: dataViewMetadata.columns[0],
                            values: ["Strawberry", "Blueberry", "Blackberry"],
                            identity: [
                                mocks.dataViewScopeIdentity("Strawberry"),
                                mocks.dataViewScopeIdentity("Blueberry"),
                                mocks.dataViewScopeIdentity("Blackberry")
                            ]
                        }],
                        values: DataViewTransform.createValueColumns([{
                            source: dataViewMetadata.columns[1],
                            values: [40, 25, 22]
                        }])
                    }
                };

                v.onDataChanged({ dataViews: [dataView2] });
                setTimeout(() => {
                    expect($(".slicerContainer")).toBeInDOM();
                    expect($(".slicerContainer .headerText")).toBeInDOM();
                    expect($(".slicerContainer .slicerHeader .clear")).toBeInDOM();
                    expect($(".slicerContainer .slicerBody")).toBeInDOM();
                    expect($(".slicerContainer .slicerBody .row .slicerText")).toBeInDOM();

                    expect($(".slicerText").length).toBe(4);
                    expect($(".slicerText").first().text()).toBe(SelectAllTextKey);
                    expect($(".slicerText").last().text()).toBe("Blackberry");
                    done();
                }, DefaultWaitForRender);
            }, DefaultWaitForRender);
        });

        it("Validate converter", (done) => {
            setTimeout(() => {
                var slicerData = Slicer.converter(dataView, SelectAllTextKey, null);
                expect(slicerData.slicerDataPoints.length).toBe(6);
                var dataViewIdentities = dataView.categorical.categories[0].identity;
                var selectionIds = [
                    SelectionId.createWithId(dataViewIdentities[0]),
                    SelectionId.createWithId(dataViewIdentities[1]),
                    SelectionId.createWithId(dataViewIdentities[2]),
                    SelectionId.createWithId(dataViewIdentities[3]),
                    SelectionId.createWithId(dataViewIdentities[4])
                ];
                var dataPoints = [
                    {
                        value: SelectAllTextKey,
                        mouseOver: false,
                        mouseOut: true,
                        identity: SelectionId.createWithMeasure(SelectAllTextKey),
                        selected: false,
                        isSelectAllDataPoint: true
                    },
                    {
                        value: "Apple",
                        mouseOver: false,
                        mouseOut: true,
                        identity: selectionIds[0],
                        selected: false
                    },
                    {
                        value: "Orange",
                        mouseOver: false,
                        mouseOut: true,
                        identity: selectionIds[1],
                        selected: false
                    },
                    {
                        value: "Kiwi",
                        mouseOver: false,
                        mouseOut: true,
                        identity: selectionIds[2],
                        selected: false
                    },
                    {
                        value: "Grapes",
                        mouseOver: false,
                        mouseOut: true,
                        identity: selectionIds[3],
                        selected: false
                    },
                    {
                        value: "Banana",
                        mouseOver: false,
                        mouseOut: true,
                        identity: selectionIds[4],
                        selected: false
                    }];

                var slicerSettings = {
                    general: {
                        outlineColor: '#000000',
                        outlineWeight: 2
                    },
                    header: {
                        height: 22,
                        borderBottomWidth: 1,
                        show: true,
                        outline: 'BottomOnly',
                        fontColor: '#000000',
                        background: '#ffffff'
                    },
                    headerText: {
                        marginLeft: 8,
                        marginTop: 0
                    },
                    slicerText: {
                        color: '#666666',
                        hoverColor: '#212121',
                        selectionColor: '#212121',
                        marginLeft: 8,
                        outline: 'None',
                        background: '#ffffff'
                    },
                    slicerItemContainer: {
                        height: 24,
                        marginTop: 5,
                        marginLeft: 8
                    },
                };

                expect(slicerData).toEqual({ categorySourceName: "Fruit", formatString: undefined, slicerSettings: slicerSettings, slicerDataPoints: dataPoints });
                done();
            }, DefaultWaitForRender);
        });

        it("Null dataView test", (done) => {
            v.onDataChanged({ dataViews: [] });
            setTimeout(() => {
                expect($(".slicerText").length).toBe(0);
                done();
            }, DefaultWaitForRender);
        });

        it("Slicer resize", (done) => {
            var viewport = {
                height: 200,
                width: 300
            };
            v.onResizing(viewport);
            setTimeout(() => {
                expect($(".slicerContainer .slicerBody").first().css("height")).toBe("177px");
                expect($(".slicerContainer .slicerBody").first().css("width")).toBe("300px");
                expect($(".slicerContainer .headerText").first().css("width")).toBe("292px");

                // Next Resize
                var viewport2 = {
                    height: 150,
                    width: 150
                };
                v.onResizing(viewport2);
                setTimeout(() => {
                    expect($(".slicerContainer .slicerBody").first().css("height")).toBe("127px");
                    expect($(".slicerContainer .slicerBody").first().css("width")).toBe("150px");
                    done();
                }, DefaultWaitForRender);
            }, DefaultWaitForRender);
        });

    });

    describe("Slicer Interactivity", () => {
        var v: powerbi.IVisual, element: JQuery, slicers: JQuery, slicerCheckboxInput: JQuery;
        var hostServices: powerbi.IVisualHostServices;
        var clearSelectionSpy: jasmine.Spy;
        beforeEach(() => {

            var originalFunc = powerbi.visuals.createInteractivityService;
            powerbi.visuals.createInteractivityService = (host) => {
                var result = originalFunc(host);
                clearSelectionSpy = spyOn(result, "clearSelection");
                clearSelectionSpy.and.callThrough();
                powerbi.visuals.createInteractivityService = originalFunc;
                return result;
            };

            element = powerbitests.helpers.testDom("200", "300");
            v = <Slicer> powerbi.visuals.visualPluginFactory.create().getPlugin("slicer").create();
            hostServices = mocks.createVisualHostServices();

            v.init({
                element: element,
                host: hostServices,
                style: powerbi.visuals.visualStyles.create(),
                viewport: {
                    height: element.height(),
                    width: element.width()
                },
                interactivity: { selection: true }
            });

            v.onDataChanged(interactiveDataViewOptions);

            slicers = $(".slicerText");

            slicerCheckboxInput = $("label.slicerCheckbox").find("input");
            spyOn(hostServices, "onSelect").and.callThrough();
        });

        it("slicer clear selection on Data Changed", (done) => {
            setTimeout(() => {
                expect(clearSelectionSpy).toHaveBeenCalled();
                done();
            }, DefaultWaitForRender);
        });

        it("slicer item select", (done) => {
            setTimeout(() => {
                (<any>slicers.eq(1)).d3Click(0, 0);

                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");
                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(true);
                expect(slicers[2].style.color).toBe("rgb(102, 102, 102)");
                expect(d3.select(slicerCheckboxInput[2]).property("checked")).toBe(false);

                expect(hostServices.onSelect).toHaveBeenCalledWith(
                    {
                        data:
                        [
                            {
                                data: [
                                    interactiveDataViewOptions.dataViews[0].categorical.categories[0].identity[0]
                                ]
                            }
                        ]
                    });
                done();
            }, DefaultWaitForRender);
        });

        it("slicer item multi-select checkboxes", (done) => {
            setTimeout(() => {
                (<any>slicers.eq(1)).d3Click(0, 0);

                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");
                expect(slicers[2].style.color).toBe("rgb(102, 102, 102)");
                expect(d3.select(slicerCheckboxInput[0]).property("checked")).toBe(false);
                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(true);
                expect(d3.select(slicerCheckboxInput[2]).property("checked")).toBe(false);

                (<any>slicers.last()).d3Click(0, 0);
                expect(slicers[5].style.color).toBe("rgb(33, 33, 33)");
                expect(d3.select(slicerCheckboxInput[5]).property("checked")).toBe(true);
                done();
            }, DefaultWaitForRender);
        });

        it("slicer item repeated selection", (done) => {
            setTimeout(() => {
                (<any>slicers.eq(1)).d3Click(0, 0);

                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");

                (<any>slicers.last()).d3Click(0, 0);
                (<any>slicers.last()).d3Click(0, 0);
                
                expect(slicers[5].style.color).toBe("rgb(102, 102, 102)");

                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(true);
                expect(d3.select(slicerCheckboxInput[5]).property("checked")).toBe(false);

                done();
            }, DefaultWaitForRender);
        });

        it("slicer selectAll", (done) => {
            setTimeout(() => {
                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(false);
                expect(d3.select(slicerCheckboxInput[2]).property("checked")).toBe(false);

                (<any>slicers.eq(0)).d3Click(0, 0);
                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(true);
                expect(d3.select(slicerCheckboxInput[2]).property("checked")).toBe(true);
                expect(d3.select(slicerCheckboxInput[5]).property("checked")).toBe(true);

                (<any>slicers.eq(1)).d3Click(0, 0);
                expect(d3.select(slicerCheckboxInput[1]).property("checked")).toBe(false);
                expect(d3.select(slicerCheckboxInput[2]).property("checked")).toBe(true);
                expect(d3.select(slicerCheckboxInput[5]).property("checked")).toBe(true);

                done();
            }, DefaultWaitForRender);
        });

        it("slicer clear", (done) => {
            setTimeout(() => {
                var clearBtn = $(".clear");

                // Slicer click
                (<any>slicers.eq(1)).d3Click(0, 0);
                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");
                expect(slicers[2].style.color).toBe("rgb(102, 102, 102)");

                (<any>slicers.last()).d3Click(0, 0);
                expect(slicers[5].style.color).toBe("rgb(33, 33, 33)");

                /* Slicer clear */
                (<any>clearBtn.first()).d3Click(0, 0);

                expect(slicers[0].style.color).toBe("rgb(102, 102, 102)");
                expect(slicers[1].style.color).toBe("rgb(102, 102, 102)");
                expect(slicers[2].style.color).toBe("rgb(102, 102, 102)");
                expect(slicers[3].style.color).toBe("rgb(102, 102, 102)");
                expect(slicers[4].style.color).toBe("rgb(102, 102, 102)");
                expect(slicers[5].style.color).toBe("rgb(102, 102, 102)");
                
                expect(hostServices.onSelect).toHaveBeenCalledWith({ data: [] });
                
                done();
            }, DefaultWaitForRender);
        });

        it("slicer mouseover", (done) => {
            setTimeout(() => {
                var event = document.createEvent("Event");
                event.initEvent("mouseover", true, true);
                slicers[0].dispatchEvent(event);

                expect(slicers[0].style.color).toBe("rgb(33, 33, 33)");
                expect(slicers[1].style.color).toBe("rgb(102, 102, 102)");
                expect(d3.select(slicerCheckboxInput[0]).property("checked")).toBe(false);

                done();
            }, DefaultWaitForRender);
        });

        it("slicer mouseout", (done) => {
            setTimeout(() => {

                // mouseover, mouseout
                var mouseOverEvent = document.createEvent("Event");
                mouseOverEvent.initEvent("mouseover", true, true);
                slicers[0].dispatchEvent(mouseOverEvent);
                expect(slicers[0].style.color).toBe("rgb(33, 33, 33)");

                var mouseOutEvent = document.createEvent("Event");
                mouseOutEvent.initEvent("mouseout", true, true);
                slicers[0].dispatchEvent(mouseOutEvent);
                expect(slicers[0].style.color).toBe("rgb(102, 102, 102)");

                (<any>slicers.eq(1)).d3Click(0, 0);
                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");

                var mouseOverEvent1 = document.createEvent("Event");
                mouseOverEvent1.initEvent("mouseover", true, true);
                slicers[1].dispatchEvent(mouseOverEvent1);
                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");

                var mouseOutEvent1 = document.createEvent("Event");
                mouseOutEvent1.initEvent("mouseout", true, true);
                slicers[1].dispatchEvent(mouseOutEvent1);
                expect(slicers[1].style.color).toBe("rgb(33, 33, 33)");

                done();
            }, DefaultWaitForRender);
        });

        it("slicer loadMoreData noSegment", () => {
            var listViewOptions: powerbi.visuals.ListViewOptions = <powerbi.visuals.ListViewOptions>v["listView"]["options"];
            var loadMoreSpy = spyOn(hostServices, "loadMoreData");
            listViewOptions.loadMoreData();
            expect(loadMoreSpy).not.toHaveBeenCalled();
        });

        it("slicer loadMoreData", () => {
            var metadata: powerbi.DataViewMetadata = {
                columns: dataViewMetadata.columns,
                segment: {}
            };

            var interactiveDataViewOptions: powerbi.VisualDataChangedOptions = {
                dataViews: [{ metadata: metadata, categorical: dataViewCategorical }]
            };
            v.onDataChanged(interactiveDataViewOptions);

            var listViewOptions: powerbi.visuals.ListViewOptions = <powerbi.visuals.ListViewOptions>v["listView"]["options"];
            var loadMoreSpy = spyOn(hostServices, "loadMoreData");
            listViewOptions.loadMoreData();
            expect(loadMoreSpy).toHaveBeenCalled();
        });

        it("slicer loadMoreData already called", () => {
            var metadata: powerbi.DataViewMetadata = {
                columns: dataViewMetadata.columns,
                segment: {}
            };

            var interactiveDataViewOptions: powerbi.VisualDataChangedOptions = {
                dataViews: [{ metadata: metadata, categorical: dataViewCategorical }]
            };
            v.onDataChanged(interactiveDataViewOptions);

            var listViewOptions: powerbi.visuals.ListViewOptions = <powerbi.visuals.ListViewOptions>v["listView"]["options"];
            var loadMoreSpy = spyOn(hostServices, "loadMoreData");
            listViewOptions.loadMoreData();
            listViewOptions.loadMoreData();
            expect(loadMoreSpy.calls.all().length).toBe(1);
        });

        it("Validate scroll position on onDataChanged", (done) => {
            var interactiveDataViewOptionsWithLoadMore: powerbi.VisualDataChangedOptions = {
                dataViews: [{ metadata: dataViewMetadata, categorical: dataViewCategorical }],
                operationKind: powerbi.VisualDataChangeOperationKind.Append
            };

            dataViewCategorical = {
                categories: [{
                    source: dataViewMetadata.columns[0],
                    values: ["PineApple", "Strawberry", "Mango", "Grapes", "Banana"],
                    identity: [
                        mocks.dataViewScopeIdentity("PineApple"),
                        mocks.dataViewScopeIdentity("Strawberry"),
                        mocks.dataViewScopeIdentity("Mango"),
                        mocks.dataViewScopeIdentity("Grapes"),
                        mocks.dataViewScopeIdentity("Banana"),
                    ]
                }],
                values: DataViewTransform.createValueColumns([{
                    source: dataViewMetadata.columns[1],
                    values: [20, 10, 30, 15, 12]
                }]),
            };
            var interactiveDataViewOptionWithCreate: powerbi.VisualDataChangedOptions = {
                dataViews: [{ metadata: dataViewMetadata, categorical: dataViewCategorical }],
                operationKind: powerbi.VisualDataChangeOperationKind.Create
            };

            var listView = <powerbi.visuals.IListView>v["listView"];
            var renderSpy = spyOn(listView, "render");

            v.onDataChanged(interactiveDataViewOptions);

            setTimeout(() => {                
                // Loading the same categories should NOT reset the scrollbar
                expect(renderSpy).toHaveBeenCalledWith(/*sizeChanged*/ true, /*resetScrollbarPosition*/ false);

                 // LoadMore should NOT reset the scrollbar
                v.onDataChanged(interactiveDataViewOptionsWithLoadMore);
                expect(renderSpy).toHaveBeenCalledWith(/*sizeChanged*/ true, /*resetScrollbarPosition*/ false);

                // OperationKind of create and data with different category identity should reset the scrollbar position
                v.onDataChanged(interactiveDataViewOptionWithCreate);
                expect(renderSpy).toHaveBeenCalledWith(/*sizeChanged*/ true, /*resetScrollbarPosition*/ true);

                done();
            }, DefaultWaitForRender);
        });

        it('show hide header test', (done) => {
            setTimeout(() => {
                expect($(".slicerHeader").css('display')).toBe('inline');

                dataView.metadata.objects = { header: { show: false } };
                v.onDataChanged({
                    dataViews: [dataView]
                });

                expect($(".slicerHeader").css('display')).toBe('none');
                done();
            }, DefaultWaitForRender);
        });

        it('background and font slicer text test', (done) => {
            setTimeout(() => {
                expect($(".slicerText").css('color')).toBe('rgb(102, 102, 102)');

                dataView.metadata.objects = {
                    Rows: {
                        fontColor: { solid: { color: '#f5f5f5' } },
                        background: { solid: { color: '#f6f6f6' } },
                    }
                };
                v.onDataChanged({
                    dataViews: [dataView]
                });

                expect($(".slicerText").css('color')).toBe('rgb(245, 245, 245)');
                expect($(".slicerText").css('background-color')).toBe('rgb(246, 246, 246)');
                done();
            }, DefaultWaitForRender);
        });

        it('background and font header test', (done) => {
            setTimeout(() => {
                expect($(".slicerHeader .headerText").css('color')).toBe('rgb(0, 0, 0)');

                dataView.metadata.objects = {
                    header: {
                        show: true,
                        fontColor: { solid: { color: '#f5f5f5' } },
                        background: { solid: { color: '#f6f6f6' } },
                    }
                };
                v.onDataChanged({
                    dataViews: [dataView]
                });

                expect($(".slicerHeader .headerText").css('color')).toBe('rgb(245, 245, 245)');
                expect($(".slicerHeader .headerText").css('background-color')).toBe('rgb(246, 246, 246)');
                done();
            }, DefaultWaitForRender);
        });

           it('test header border outline', (done) => {
            setTimeout(() => {
                expect($(".headerText").css('border-width')).toBe('0px 0px 2px');

                dataView.metadata.objects = { header: { outline: 'None' } };
                v.onDataChanged({
                    dataViews: [dataView]
                });
                expect($(".headerText").css('border-width')).toBe('0px');

                dataView.metadata.objects = { header: { outline: 'TopOnly' } };
                v.onDataChanged({
                    dataViews: [dataView]
                });
                expect($(".headerText").css('border-width')).toBe('2px 0px 0px');

                dataView.metadata.objects = { header: { outline: 'TopBottom' } };
                v.onDataChanged({
                    dataViews: [dataView]
                });
                expect($(".headerText").css('border-width')).toBe('2px 0px');

                dataView.metadata.objects = { header: { outline: 'LeftRight' } };
                v.onDataChanged({
                    dataViews: [dataView]
                });
                expect($(".headerText").css('border-width')).toBe('0px 2px');

                dataView.metadata.objects = { header: { outline: 'Frame' } };
                v.onDataChanged({
                    dataViews: [dataView]
                });
                expect($(".headerText").css('border-width')).toBe('2px');

                done();
            }, DefaultWaitForRender);
        });

    });
}