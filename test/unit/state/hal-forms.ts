import { expect } from 'chai';
import { factory } from '../../../src/state/hal';
import { Action, Client, Field } from '../../../src';
import { HalFormsProperty } from 'hal-types';

type CompareAction = Omit<Action, 'submit' | 'field' |  'submitFollow'>;

describe('HAL forms', () => {

  it('should parse a basic HAL form', async () => {

    const hal = await callFactory({
      _links: {
      },
      _templates: {
        default: {
          target: '/submit',
          method: 'POST',
        },
        delete: {
          target: '/delete',
          method: 'DELETE'
        }
      }
    });

    const defaultAction:any = hal.action('default');
    delete defaultAction.client;
    delete defaultAction.submit;

    const expectedDefaultAction: CompareAction = {
      uri: 'http://example/submit',
      name: 'default',
      title: undefined,
      contentType: 'application/json',
      method: 'POST',
      fields: [],
    };

    expect(defaultAction).to.eql(expectedDefaultAction);

    const deleteAction:any = hal.action('delete');
    delete deleteAction.client;
    delete deleteAction.submit;

    const expectedDeleteAction: CompareAction = {
      uri: 'http://example/delete',
      name: 'delete',
      title: undefined,
      contentType: 'application/json',
      method: 'DELETE',
      fields: [],
    };

    expect(deleteAction).to.eql(expectedDeleteAction);

  });
  it('should relate relative URIs of embedded HAL forms to the embedded resource\'s self uri', async () => {

    const hal = await callFactory({
      _links: {
      },
      _embedded: {
        foo: {
          _links: {
            self: { href: '/foo/' },
          },
          _templates: {
            default: {
              target: 'bar',
              method: 'POST',
            },
          }
        }
      }
    });

    const defaultAction:any = hal.getEmbedded()[0].action('default');
    delete defaultAction.client;

    const expectedDefaultAction: CompareAction = {
      uri: 'http://example/foo/bar',
      name: 'default',
      title: undefined,
      contentType: 'application/json',
      method: 'POST',
      fields: [],
    };

    expect(defaultAction).to.eql(expectedDefaultAction);

  });
  it('should default to the resource\'s self uri if no target was given', async () => {

    const hal = await callFactory({
      _links: {
      },
      _embedded: {
        foo: {
          _links: {
            self: { href: '/foo/' },
          },
          _templates: {
            default: {
              method: 'POST',
            },
          }
        }
      }
    });

    const defaultAction:any = hal.getEmbedded()[0].action('default');
    delete defaultAction.client;

    const expectedDefaultAction: CompareAction = {
      uri: 'http://example/foo/',
      name: 'default',
      title: undefined,
      contentType: 'application/json',
      method: 'POST',
      fields: [],
    };

    expect(defaultAction).to.eql(expectedDefaultAction);

  });
  it('should parse a field', async () => {

    const hal = await callFactory({
      _links: {
      },
      _templates: {
        default: {
          target: '/submit',
          method: 'POST',
          properties: [
            {
              type: 'text',
              name: 'text',
            },
          ]
        }
      }
    });

    const action:any = hal.action('default');
    delete action.client;
    delete action.submit;

    const expected: CompareAction = {
      uri: 'http://example/submit',
      name: 'default',
      title: undefined,
      contentType: 'application/json',
      method: 'POST',
      fields: [
        {
          type: 'text',
          name: 'text',
          required: false,
          readOnly: false,

          label: undefined,
          pattern: undefined,
          placeholder: undefined,
          maxLength: undefined,
          minLength: undefined,
          value: undefined,
        }
      ],
    };

    expect(action).to.eql(expected);

  });
  it('should parse embedded actions', async () => {
    const hal = await callFactory({
      _links: {
        self: {
          href: '/foo'
        }
      },
      _embedded: {
        content: [{
          _links: {
            self: {
              href: '/foo/1',
            }
          },
          _templates: {
            default: {
              target: '/foo/1',
              method: 'PUT',
              properties: [
                {
                  type: 'text',
                  name: 'text',
                },
              ]
            }
          },
          id: 1,
        }]
      },
      _templates: {
        default: {
          target: '/foo',
          method: 'POST',
          properties: [
            {
              type: 'text',
              name: 'text',
            },
          ]
        }
      }
    });
    const embeddedAction: any = hal.getEmbedded()[0].action('default');
    delete embeddedAction.client;
    delete embeddedAction.submit;

    const expected: CompareAction = {
      uri: 'http://example/foo/1',
      name: 'default',
      title: undefined,
      contentType: 'application/json',
      method: 'PUT',
      fields: [
        {
          type: 'text',
          name: 'text',
          required: false,
          readOnly: false,
          label: undefined,
          pattern: undefined,
          placeholder: undefined,
          maxLength: undefined,
          minLength: undefined,
          value: undefined,
        }
      ],
    };

    expect(embeddedAction).to.eql(expected);
  });

  describe('fields', () => {

    testField(
      'text field',
      {
        type: 'text',
        name: 'text',
      }, {
        type: 'text',
        name: 'text',
        required: false,
        readOnly: false,
      }
    );

    testField(
      'text field with the type property omitted',
      {
        name: 'text',
        required: true,
        readOnly: false,
        regex: '[a-z]',
      }, {
        type: 'text',
        name: 'text',
        required: true,
        readOnly: false,
        pattern: /[a-z]/,
      }
    );

    testField(
      'hidden field',
      {
        type: 'hidden',
        name: 'hidden',
      }, {
        type: 'hidden',
        name: 'hidden',
        required: false,
        readOnly: false,
      });
    testField(
      'password field',
      {
        type: 'password',
        name: 'password',
      }, {
        type: 'password',
        name: 'password',
        required: false,
        readOnly: false,
      }
    );
    testField(
      'textarea field',
      {
        type: 'textarea',
        name: 'textarea',
      }, {
        type: 'textarea',
        name: 'textarea',
        required: false,
        readOnly: false,
      }
    );
    testField(
      'time field',
      {
        type: 'time',
        name: 'time',
      }, {
        type: 'time',
        name: 'time',
        required: false,
        readOnly: false,
      }
    );
    testField(
      'number field',
      {
        type: 'number',
        name: 'number',
      }, {
        type: 'number',
        name: 'number',
        required: false,
        readOnly: false,
      }
    );
    testField(
      'number field with value',
      {
        type: 'number',
        name: 'number',
        value: '5',
        required: true,
        readOnly: true,
      }, {
        type: 'number',
        name: 'number',
        value: 5,
        required: true,
        readOnly: true,
      }
    );
    testField(
      'datetime-local field',
      {
        type: 'datetime-local',
        name: 'datetime-local',
        required: true,
        readOnly: true,
      }, {
        type: 'datetime-local',
        name: 'datetime-local',
        required: true,
        readOnly: true,
      }
    );
    testField(
      'datetime-local field with value',
      {
        type: 'datetime-local',
        name: 'datetime-local',
        value: '20210221T213100Z',
      }, {
        type: 'datetime-local',
        name: 'datetime-local',
        value: new Date('20210221T213100Z'),
        required: false,
        readOnly: false,
      }
    );
    testField(
      'color field',
      {
        type: 'color',
        name: 'color',
      }, {
        type: 'color',
        name: 'color',
        required: false,
        readOnly: false,
      }
    );

    testField(
      'dropdown with inline options',
      {
        type: 'text',
        name: 'dropdown',
        options: {
          inline: [
            {
              prompt: 'l1',
              value: 'v1',
            },
            {
              prompt: 'l2',
              value: 'v2',
            },
          ]
        }
      }, {
        type: 'select',
        name: 'dropdown',
        required: false,
        readOnly: false,
        options: {
          v1: 'l1',
          v2: 'l2'
        }
      });

    testField(
      'dropdown with inline options, specified as an array of strings',
      {
        type: 'text',
        name: 'dropdown',
        options: {
          inline: ['v1', 'v2'],
        }
      }, {
        type: 'select',
        name: 'dropdown',
        required: false,
        readOnly: false,
        options: {
          v1: 'v1',
          v2: 'v2'
        }
      });

    testField(
      'dropdown with external options',
      {
        type: 'text',
        name: 'dropdown',
        options: {
          link: {
            href: '/get-options',
          },
        }
      }, {
        type: 'select',
        name: 'dropdown',
        required: false,
        readOnly: false,
        dataSource: {
          href: '/get-options',
          labelField: 'prompt',
          valueField: 'value',
        }
      });

  });

});

function callFactory(body: any, url = 'http://example/') {

  const response = new Response(JSON.stringify(body));
  return factory(new Client(url), url, response);

}

async function testField(title: string, halField: HalFormsProperty, kettingField: Field) {

  it('should parse a ' + title, async() => {

    const hal = await callFactory({
      _links: {
      },
      _templates: {
        default: {
          target: '/submit',
          method: 'POST',
          properties: [halField]
        }
      }
    });

    const testField:any = hal.action('default').fields[0];
    // Remove undefined
    for(const [k,v] of Object.entries(testField)) {
      if (v===undefined) delete testField[k];
      if (k==='dataSource') {
        for(const [k2,v2] of Object.entries(v as any)) {
          if (v2===undefined) delete testField[k][k2];
        }
      }
    }

    expect(testField).to.eql(kettingField);

  });

}
