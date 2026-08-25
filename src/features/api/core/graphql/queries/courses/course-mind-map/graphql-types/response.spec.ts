import {
    CourseMindMapResponseData, MindMapEdge, MindMapNode, MindMapNodeData, MindMapNodePosition 
} from "./response"
describe("course mind map response DTOs",
    () => { it("preserves graph node coordinates and edges",
        () => { const position = Object.assign(new MindMapNodePosition(),
            {
                x: 1.5, y: 2 
            }); const nodeData = Object.assign(new MindMapNodeData(),
            {
                label: "Course", kind: "course", entityId: "c1", moduleId: null, displayId: "course", links: [], desc: null, popularity: null 
            }); const node = Object.assign(new MindMapNode(),
            {
                id: "course-c1", type: null, position, data: nodeData 
            }); const edge = Object.assign(new MindMapEdge(),
            {
                id: "e1", source: node.id, target: "module-m1", type: null, animated: false 
            }); expect(Object.assign(new CourseMindMapResponseData(),
            {
                nodes: [node], edges: [edge] 
            })).toMatchObject({
            nodes: [{
                position: {
                    x: 1.5 
                }, data: {
                    entityId: "c1" 
                } 
            }], edges: [{
                animated: false 
            }] 
        }) }) })
