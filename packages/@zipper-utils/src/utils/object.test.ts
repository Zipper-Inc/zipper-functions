import { InputType } from '@zipper/types';
import { getInputsFromFormData } from './object';

describe('getInputsFromFormData', () => {
  test('extracts string type input from formData correctly', () => {
    const formData = {
      'worldString:string': 'some',
    };
    const inputParams = [
      { key: 'worldString', type: 'string' as InputType, optional: false },
    ];
    const expectedInputs = {
      worldString: 'some',
    };
    expect(getInputsFromFormData(formData, inputParams)).toEqual(
      expectedInputs,
    );
  });
  test('parses and extracts "any" type input as an object from formData', () => {
    const formData = { 'worldString:any': '{"some":"foo"}' };
    const inputParams = [
      { key: 'worldString', type: 'any' as InputType, optional: false },
    ];

    const expectedInputs = {
      worldString: {
        some: 'foo',
      },
    };
    expect(getInputsFromFormData(formData, inputParams)).toEqual(
      expectedInputs,
    );
  });
});
