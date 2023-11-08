import { InputType } from '@zipper/types';
import { getInputsFromFormData } from './object';

describe('getInputsFromFormData', () => {
  it('should return the expected inputs from the form data', () => {
    const formData = {
      input1: 'value1',
      input2: 'value2',
      input3: 'value3',
      input4: 'value4',
    };
    const inputParams = [
      { key: 'input1', type: InputType.string },
      { key: 'input2', type: InputType.string },
      { key: 'input3', type: InputType.string },
    ];
    const expectedInputs = {
      input1: 'value1',
      input2: 'value2',
      input3: 'value3',
    };
    expect(getInputsFromFormData(formData, inputParams)).toEqual(
      expectedInputs,
    );
  });
});
