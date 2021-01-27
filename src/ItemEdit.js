import React, { useState } from 'react';
import {
  Box,
  Button,
  DateInput,
  Footer,
  Form,
  FormField,
  Header,
  Heading,
  Layer,
  TextArea,
  TextInput,
} from 'grommet';
import { update } from './data';
import Auth from './Auth';
import {
  AddCircle,
  Close,
  Figma,
  FormClose,
  FormDown,
  Github,
  Link,
} from 'grommet-icons';

const defaultItem = { name: '', section: '' };

const ItemEdit = ({ index, roadmap, onChange, onDone }) => {
  const [value, setValue] = useState(
    index >= 0 ? roadmap.items[index] : defaultItem,
  );
  const [changing, setChanging] = useState();
  const [auth, setAuth] = useState();

  const [linkFields, setLinkFields] = useState(
    index >= 0 && roadmap.items.length !== 0
      ? roadmap.items[index].linkFields
      : [{ linkUrl: '' }],
  );

  const [dateFields, setDateFields] = useState(
    index >= 0 && roadmap.items.length !== 0
      ? roadmap.items[index].dateFields
      : [{ date: '', stage: '', progress: '' }],
  );

  const submit = (password) => {
    // remove empty link fields
    for (let i = 0; i < linkFields.length; i++) {
      delete value[`${i}linkUrl`];
      if (linkFields[i].linkUrl === '') linkFields.splice(i, 1);
    }
    for (let i = 0; i < dateFields.length; i++) {
      delete value[`${i}DateProgress`];
      delete value[`${i}DateStage`];
      if (dateFields[i].date === '') dateFields.splice(i, 1);
    }
    value.linkFields = JSON.parse(JSON.stringify(linkFields));
    value.dateFields = JSON.parse(JSON.stringify(dateFields));

    setChanging(true);
    setAuth(false);

    const nextRoadmap = JSON.parse(JSON.stringify(roadmap));
    const nextItem = { ...value };
    delete nextItem.index;
    if (!nextItem.section) delete nextItem.section;
    if (index >= 0) nextRoadmap.items[index] = nextItem;
    else nextRoadmap.items.unshift(nextItem);
    // add section, if needed
    if (
      nextItem.section &&
      !nextRoadmap.sections.find((s) => nextItem.section)
    ) {
      nextRoadmap.sections.push(nextItem.section);
    }
    // add label, if needed
    for (let x in dateFields)
      if (
        !nextRoadmap.labels.find(
          ({ name }) => name === nextItem.dateFields[x].stage,
        )
      ) {
        nextRoadmap.labels.push({ name: nextItem.dateFields[x].stage });
      }
    update(nextRoadmap, password)
      .then(() => {
        setChanging(false);
        onChange(nextRoadmap);
        onDone();
        if (index >= 0) onDone();
      })
      .catch((status) => {
        if (status === 401) setAuth(true);
        else onDone();
      });
  };

  if (Object.keys(roadmap.labels).length === 0) {
    roadmap.labels = [
      { name: 'Exploration', color: 'purple' },
      { name: 'Implement', color: 'green' },
      { name: 'Ideate', color: 'blue' },
    ];
  }

  const handleAddUrl = () => {
    const links = [...linkFields];
    links.push({ linkUrl: '' });
    setLinkFields(links);
  };

  const handleRemoveUrl = (index) => {
    const links = [...linkFields];
    links.splice(index, 1);
    setLinkFields(links);
    value[index + 'linkUrl'] = '';
  };

  const handleAddDateField = () => {
    const links = [...dateFields];
    links.push({ date: '', stage: '', progress: '' });
    setDateFields(links);
  };

  const handleRemoveDateField = (index) => {
    const links = [...dateFields];
    links.splice(index, 1);
    setDateFields(links);
  };

  const handleLinkInputChange = (index, event) => {
    const values = [...linkFields];
    if (event.target.name.includes('linkUrl')) {
      values[index].linkUrl = event.target.value;
    }
    setLinkFields(values);
  };

  const handleDateInputChange = (index, event) => {
    const values = [...dateFields];
    if (event.value !== '') values[index].date = event.value;
    setDateFields(values);
  };

  const handleSuggestionSelect = (index, event) => {
    const values = [...dateFields];
    if (event.target.name && event.target.name.includes('Stage')) {
      values[index].stage = event.suggestion;
    } else if (event.target.name && event.target.name.includes('Progress')) {
      values[index].progress = event.suggestion;
    }
    setDateFields(values);
  };

  const handleAdditionalInputChange = (index, event) => {
    const values = [...dateFields];
    if (event.target.name && event.target.name.includes('Stage')) {
      values[index].stage = event.target.value;
    } else if (event.target.name && event.target.name.includes('Progress')) {
      values[index].progress = event.target.value;
    }
    setDateFields(values);
  };

  return (
    <Layer position="center" onEsc={onDone}>
      <Box>
        <Box pad={{ horizontal: 'large', vertical: 'small' }} width="large">
          <Header>
            <Heading level={2} size="small">
              {index >= 0 ? 'Edit Task' : 'Create a New Task'}
            </Heading>
            <Button icon={<Close />} onClick={onDone} />
          </Header>
          {auth ? (
            <Auth onChange={submit} />
          ) : (
            <Form value={value} onChange={setValue} onSubmit={() => submit()}>
              <FormField name="section" htmlFor="section" margin="none">
                <TextInput
                  icon={<FormDown />}
                  reverse
                  name="section"
                  id="section"
                  placeholder="Template"
                  suggestions={roadmap.sections}
                />
              </FormField>
              <FormField name="name" htmlFor="name" required>
                <TextInput name="name" id="name" placeholder="Title" />
              </FormField>
              <FormField
                name="note"
                htmlFor="note"
                margin={{ bottom: 'medium' }}
              >
                <TextArea name="note" id="note" placeholder="Notes" />
              </FormField>
              {linkFields.map((linkField, index) => (
                <Box direction="row" key={`${linkField}~${index}`}>
                  <FormField
                    fill="horizontal"
                    name={`${index}linkUrl`}
                    htmlFor={`${index}linkUrl`}
                  >
                    <TextInput
                      onChange={(event) => handleLinkInputChange(index, event)}
                      name={`${index}linkUrl`}
                      id={`${index}linkUrl`}
                      value={linkFields[`${index}`].linkUrl}
                      placeholder="URL"
                    />
                  </FormField>
                  {linkField.linkUrl && (
                    <Box
                      align="end"
                      margin={{ horizontal: 'small', vertical: 'xsmall' }}
                      border="all"
                      round="xsmall"
                    >
                      <Box align="center" pad="xsmall">
                        {linkField.linkUrl.includes('figma.com') ? (
                          <Figma color="plain" />
                        ) : linkField.linkUrl.includes('github.com') ? (
                          <Github />
                        ) : (
                          <Link />
                        )}
                      </Box>
                    </Box>
                  )}
                  <Box alignContent="center">
                    <FormClose onClick={() => handleRemoveUrl(index)} />
                  </Box>
                </Box>
              ))}
              <Box align="center" onClick={() => handleAddUrl()}>
                <AddCircle color="border" />
              </Box>
              {dateFields.map((dateField, index) => (
                <Box
                  direction="row-responsive"
                  align="start"
                  justify="between"
                  gap="small"
                  key={`${dateField}~${index}`}
                  margin={{ bottom: 'small' }}
                >
                  <FormField
                    name={`DateTarget${index}`}
                    htmlFor={`DateTarget${index}`}
                    required
                    margin="none"
                  >
                    <DateInput
                      onChange={(event) => handleDateInputChange(index, event)}
                      name={`DateTarget${index}`}
                      htmlFor={`DateTarget${index}`}
                      value={dateFields[`${index}`].date}
                      format="mm/dd/yyyy"
                      placeholder="Date"
                    />
                  </FormField>
                  <FormField
                    name={`${index}DateStage`}
                    htmlFor={`${index}DateStage`}
                  >
                    <TextInput
                      onChange={(event) =>
                        handleAdditionalInputChange(index, event)
                      }
                      onSuggestionSelect={(event) =>
                        handleSuggestionSelect(index, event)
                      }
                      name={`${index}DateStage`}
                      htmlFor={`${index}DateStage`}
                      icon={<FormDown />}
                      reverse
                      value={dateFields[`${index}`].stage}
                      placeholder="Design Stage"
                      suggestions={roadmap.labels.map(({ name }) => name)}
                    />
                  </FormField>
                  <FormField
                    name={`${index}DateProgress`}
                    htmlFor={`${index}DateProgress`}
                    margin="none"
                  >
                    <TextInput
                      onChange={(event) =>
                        handleAdditionalInputChange(index, event)
                      }
                      onSuggestionSelect={(event) =>
                        handleSuggestionSelect(index, event)
                      }
                      icon={<FormDown />}
                      reverse
                      name={`${index}DateProgress`}
                      htmlFor={`${index}DateProgress`}
                      value={dateFields[`${index}`].progress}
                      placeholder="Progress"
                      suggestions={['Not Started', 'In Progress', 'Complete']}
                    />
                  </FormField>
                  <Box alignContent="center">
                    <FormClose onClick={() => handleRemoveDateField(index)} />
                  </Box>
                </Box>
              ))}
              <Box align="center" onClick={() => handleAddDateField()}>
                <AddCircle color="border" />
              </Box>

              <Footer margin={{ vertical: 'medium' }}>
                <Button
                  type="submit"
                  primary
                  label={index >= 0 ? 'Update' : 'Add'}
                  disabled={changing}
                />
                {index >= 0 && (
                  <Button
                    label="Delete"
                    onClick={() => {
                      setChanging(true);
                      const nextRoadmap = JSON.parse(JSON.stringify(roadmap));
                      nextRoadmap.items.splice(index, 1);
                      update(nextRoadmap).then(() => {
                        setChanging(false);
                        onChange(nextRoadmap);
                        if (index >= 0) onDone();
                      });
                    }}
                  />
                )}
              </Footer>
            </Form>
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default ItemEdit;
