/**
 * The most atomic unit of data in Zipper
 * @category Primitive
 */
type Primitive = string | Date | number | boolean | null | undefined;

/**
 * Zipper objects can only be keyed by string or number
 * @category Primitive
 */
type PrimitiveKey = string | number;

/**
 * Any data structure that can me serialized into JSON
 * @category Primitive
 */
export type Serializable =
  | Primitive
  | Serializable[]
  | { [key: PrimitiveKey]: Serializable };

/**
 * The inputs for a Applet function
 * Passed as a single object with named parameters
 * @category Applet
 */
export type Inputs = { [key: string]: Serializable | undefined };

export type Output = Serializable | void;

/**
 * Passed in when creating an Applet
 */
export type AppletOptions = {
  debug?: boolean;
  overrideHost?: string;
  token?: string;
};

/**
 * The API Response from a Zipper Applet
 */
export type ApiResponse<D extends Output = any> = {
  ok: boolean;
  data: D;
  error?: string;
};

/**
 * A client for running an individual path
 * Accepts input and output types
 */
export interface ZipperRunClient<
  II extends Inputs = Inputs,
  OO extends Output = any,
> {
  url: string;
  run<I extends Inputs = II, O extends Output = OO>(inputs?: I): Promise<O>;
  run<I extends Inputs = II, O extends Output = OO>(
    path?: string,
    Inputs?: I,
  ): Promise<O>;
}
