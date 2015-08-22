/// <reference path='../../typings/angularjs/angular.d.ts' />

import {extend, isArray, isString, identity, noop, Predicate,
    defaults, map, omit, pluck, find, pipe, prop, eq}  from "../common/common";
import trace  from "../common/trace";
import {runtime} from "../common/angular1"
import {IPromise} from "angular";

import {INode, IParamsNode, IParamsPath} from "./interface";

import {IState, IStateDeclaration, IStateOrName} from "../state/interface";
import TargetState from "../state/targetState"

import {IResolvables} from "../resolve/interface";
import Resolvable from "../resolve/resolvable";

const stateMatches = (state: IState|IStateDeclaration) => (node) => node.state === state || node.state.self === state;
const stateNameMatches = (stateName: string) => (node) => node.state.name === stateName;
const shallowNodeCopy = node => extend({}, node);

/**
 * A Path Object represents a Path of nested States within the State Hierarchy. 
 * Each node of the path holds the IState object, and additional data, according
 * to the use case.   
 *
 * A Path can be used to construct new Paths based on the current Path via the concat 
 * and slice helper methods.
 *
 * @param _nodes [array]: an array of INode data
 */
export default class Path<NODE extends INode> {
  constructor(private _nodes: NODE[]) { }
  
  /**
   * returns a subpath of this path from the root path element up to and including the toState parameter.
   * Each node of the subpath is a shallow copy of the original node.
   *
   * @param toState A state or name of a state
   */
  pathFromRootTo(toState: IStateOrName): Path<NODE> {
    let predicate = isString(toState) ? stateNameMatches(<string> toState) : stateMatches(<IState> toState);
    var node = find(this._nodes, predicate);
    var elementIdx = this._nodes.indexOf(node);
    if (elementIdx == -1) throw new Error("This Path does not contain the toPathElement");
    return this.slice(0, elementIdx + 1);
  }

  /**
   * Returns a new Path which contains this Path's nodes, concatenated with another Path's nodes.
   * Each node of the concatenated Path is a shallow copy of the original nodes.
   */
  concat(path: Path<NODE>): Path<NODE> {
    return new Path(this._nodes.concat(path._nodes).map(shallowNodeCopy));
  }

  /**
   * Returns a new Path which is a subpath of this Path.  The new Path contains nodes starting from "start" and
   * ending at "end".  Each node of the subpath is a shallow copy of the original Path's node.
   */
  slice(start: number, end?: number): Path<NODE> {
    return new Path(this._nodes.slice(start, end).map(shallowNodeCopy));
  }

  /**
   * Returns a new Path which is a copy of this Path, but with nodes in reverse order.
   * Each node in the reversed path is a shallow copy of the original Path's node.
   */
  reverse(): Path<NODE> {
    let copy = [].concat(this._nodes).map(shallowNodeCopy);
    copy.reverse();
    return new Path(copy);
  }

  /** Returns the "state" property of each node in this Path */
  states(): IState[] {
    return this._nodes.map(prop("state"));
  }

  /** Gets the first node that exactly matches the given state */
  nodeForState(state: IState): NODE {
    return find(this._nodes, pipe(prop('state'), eq(state)));
  }

  /** Returns the Path's nodes wrapped in a new array */
  nodes(): NODE[] {
    return [].concat(this._nodes);
  }

  /** Returns the last node in the Path  */
  last(): NODE {
    return this._nodes.length ? this._nodes[this._nodes.length - 1] : null;
  }

  /** Returns a new path where each path element is mapped using the nodeMapper function */
  adapt<T extends INode>(nodeMapper: (NODE, idx?) => T): Path<T> {
    var adaptedNodes = this._nodes.map(nodeMapper);
    return new Path(adaptedNodes);
  }

  toString() {
    var elements = this._nodes.map(e => e.state.name).join(", ");
    return `Path([${elements}])`;
  }
}