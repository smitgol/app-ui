import createEngine, {
  DefaultLinkModel,
  DefaultNodeModel,
  DiagramModel,
  DefaultPortModel,
  DefaultLinkFactory,
  DefaultLinkWidget,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import { LinkWidget, PointModel } from "@projectstorm/react-diagrams-core";
import axios from "axios";
import { server_address } from "./config";
class AdvancedLinkModel extends DefaultLinkModel {
  constructor() {
    super({
      type: "advanced",
      width: 10,
    });
  }
}

class AdvancedPortModel extends DefaultPortModel {
  createLinkModel() {
    return new AdvancedLinkModel();
  }
}

const CustomLinkArrowWidget = (props) => {
  const { point, previousPoint } = props;

  const angle =
    90 +
    (Math.atan2(
      point.getPosition().y - previousPoint.getPosition().y,
      point.getPosition().x - previousPoint.getPosition().x
    ) *
      180) /
      Math.PI;
  return (
    <g
      transform={
        "translate(" +
        point.getPosition().x +
        ", " +
        point.getPosition().y +
        ")"
      }
    >
      <g style={{ transform: "rotate(" + angle + "deg)" }}>
        <g transform={"translate(0, -3)"}>
          <polygon
            points="0,10 8,30 -8,30"
            fill={props.color}
            data-id={point.getID()}
            data-linkid={point.getLink().getID()}
          />
        </g>
      </g>
    </g>
  );
};

class AdvancedLinkWidget extends DefaultLinkWidget {
  generateArrow(point = PointModel, previousPoint = PointModel) {
    return (
      <CustomLinkArrowWidget
        key={point.getID()}
        point={point}
        previousPoint={previousPoint}
        colorSelected={this.props.link.getOptions().selectedColor}
        color={this.props.link.getOptions().color}
      />
    );
  }

  render() {
    var points = this.props.link.getPoints();
    var paths = [];
    this.refPaths = [];

    for (let j = 0; j < points.length - 1; j++) {
      paths.push(
        this.generateLink(
          LinkWidget.generateLinePath(points[j], points[j + 1]),
          {
            "data-linkid": this.props.link.getID(),
            "data-point": j,
            onMouseDown: (event) => {
              this.addPointToLink(event, j + 1);
            },
          },
          j
        )
      );
    }

    //render the circles
    for (let i = 1; i < points.length - 1; i++) {
      paths.push(this.generatePoint(points[i]));
    }

    if (this.props.link.getTargetPort() !== null) {
      paths.push(
        this.generateArrow(points[points.length - 1], points[points.length - 2])
      );
    } else {
      paths.push(this.generatePoint(points[points.length - 1]));
    }

    return (
      <g data-default-link-test={this.props.link.getOptions().testName}>
        {paths}
      </g>
    );
  }
}

class AdvancedLinkFactory extends DefaultLinkFactory {
  constructor() {
    super("advanced");
  }

  generateModel() {
    return new AdvancedLinkModel();
  }

  generateReactWidget(event) {
    return (
      <AdvancedLinkWidget link={event.model} diagramEngine={this.engine} />
    );
  }
}

const CanvasComponent = () => {
  const send_data = async (data) => {
    axios
      .post(`${server_address}:3001/api/state/cache`, data)
      .then(function (response) {
        console.log(response);
      });
  };

  const engine = createEngine();
  engine.getLinkFactories().registerFactory(new AdvancedLinkFactory());
  const node1 = new DefaultNodeModel({
    name: "Source",
    color: "white",
  });
  node1.setPosition(200, 100);
  let port1 = node1.addPort(new AdvancedPortModel(false, "out"));

  // node 2
  const node2 = new DefaultNodeModel({
    name: "Destination",
    color: "white",
  });

  node2.setPosition(400, 100);
  let port2 = node2.addPort(new AdvancedPortModel(true, "in"));
  const model = new DiagramModel();
  const link = port1.link(port2);

  model.addAll(node1, node2, link);
  engine.setModel(model);

  node1.registerListener({
    eventDidFire: () => {
      console.log("node1 eventDidFire");
    },
  });
  node2.registerListener({
    eventDidFire: () => {
      console.log("node2 eventDidFire");
    },
  });
  model.registerListener({
    eventDidFire: (e) => {
      console.log("model eventDidFire");
    },
    linksUpdated: (e) => {
      let obj = e.entity.activeNodeLayer.models;
      let source = e.link.sourcePort.parent.options;
      let target = e.link.targetPort;
      let state = { components: [], links: [] };
      Object.values(obj).map((obj) => {
        let id = obj.options["id"];
        let name = obj.options.name;
        state["components"].push({ id: id, name: name });
      });
      if (target) {
        state["links"].push({ src: source.id, dest: target.id });
      }
      console.log("link updated");
      send_data(state);
    },
    nodesUpdated: (e) => {
      console.log("node updated");
    },
  });

  return (
    <div className="diagram-container">
      <CanvasWidget className="canvas" engine={engine} />
    </div>
  );
};

export default CanvasComponent;
