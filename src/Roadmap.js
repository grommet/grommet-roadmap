import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Footer,
  Grid,
  Header,
  Heading,
  Keyboard,
  Markdown,
  Menu,
  Paragraph,
  ResponsiveContext,
  Stack,
  Text,
  ThemeContext,
} from 'grommet';
import {
  Add,
  Blank,
  CircleInformation,
  FormDown,
  More,
  Navigate,
  Next,
  Previous,
  Sun,
} from 'grommet-icons';
import { grommet } from 'grommet/themes';
import { hpe } from 'grommet-theme-hpe';
import { addMonths, sameMonth, subtractMonths } from './utils';
import { get, update } from './data';
import Swipe from './Swipe';
import ItemEdit from './ItemEdit';
import RoadmapEdit from './RoadmapEdit';
import Auth from './Auth';
import LinkIcon from './LinkIcon';

const themes = {
  hpe: hpe,
  grommet: grommet,
};

const monthCounts = {
  small: 1,
  medium: 3,
  large: 4,
};

// allow for gap in Grid
const columnPercents = {
  small: 'full',
  medium: '32%',
  large: '24%',
};

const firstDate = (dateFields) =>
  dateFields.map(({ date }) => new Date(date)).sort((d1, d2) => d1 - d2)[0];

const byDate = (i1, i2) => {
  const d1 = firstDate(i1.dateFields);
  const d2 = firstDate(i2.dateFields);
  if (!d1) return -1;
  if (!d2) return 1;
  return d1 - d2;
};

const now = new Date();
now.setDate(1);

const Roadmap = ({ identifier, onClose, onThemeMode }) => {
  const responsive = useContext(ResponsiveContext);
  const [date, setDate] = useState(now);
  const [auth, setAuth] = useState();
  const [password, setPassword] = React.useState();
  const [roadmap, setRoadmap] = useState();
  const [editing, setEditing] = useState();
  const [editRoadmap, setEditRoadmap] = useState();
  const [itemIndex, setItemIndex] = useState();
  const [dragging, setDragging] = React.useState();
  const [dropTarget, setDropTarget] = React.useState();
  const [prevTarget, setPrevTarget] = React.useState();
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    get(password ? { ...identifier, password } : identifier)
      .then(setRoadmap)
      .catch((status) => {
        if (status === 401) setAuth(true);
        if (status === 404) onClose();
      });
  }, [identifier, onClose, password]);

  useEffect(() => {
    if (roadmap) document.title = roadmap.name;
  }, [roadmap]);

  const items = useMemo(
    () =>
      roadmap
        ? roadmap.items.map((item, index) => ({ ...item, index }))
        : undefined,
    [roadmap],
  );

  // months to show, array of Date objects
  const months = useMemo(
    () =>
      Array.from(Array(monthCounts[responsive])).map((_, i) =>
        addMonths(date, i),
      ),
    [date, responsive],
  );

  // normalize data for how we want to display it
  // section -> month -> items
  const sections = useMemo(() => {
    let result = [];
    if (roadmap) {
      const monthsItems = items.filter(({ dateFields }) =>
        months.some((month) =>
          dateFields.some((dateField) => sameMonth(month, dateField.date)),
        ),
      );
      result = roadmap.sections
        .map((name) => ({
          name,
          months: months.map((month) => ({
            month,
            items: monthsItems
              .filter(({ section, dateFields }) =>
                dateFields.some(
                  (dateField) =>
                    name === section && sameMonth(month, dateField.date),
                ),
              )
              .sort(byDate),
          })),
        }))
        .filter((s) => s.months.some((m) => m.items.length) && s.name !== '');
      // add any non-section items
      const nonSectionItems = monthsItems.filter(({ section }) => !section);
      if (nonSectionItems.length) {
        result.push({
          months: months.map((month) => ({
            month,
            items: nonSectionItems
              .filter(({ dateFields }) =>
                dateFields.some((dateField) =>
                  sameMonth(month, dateField.date),
                ),
              )
              .sort(byDate),
          })),
        });
      }
    }
    return result;
  }, [items, months, roadmap]);

  const Row = (props) => {
    if (responsive === 'small') return <Box {...props} />;
    return (
      <Grid
        columns={[
          'flex',
          ['small', responsive === 'medium' ? 'xlarge' : '80vw'],
          'flex',
        ]}
      >
        <Box />
        <Grid columns={columnPercents[responsive]} gap="small" {...props} />
        <Box />
      </Grid>
    );
  };

  const onNext = useCallback(() => setDate(addMonths(date, 1)), [date]);
  const onPrevious = useCallback(() => setDate(subtractMonths(date, 1)), [
    date,
  ]);

  const moveItem = useCallback(
    (event) => {
      const nextRoadmap = JSON.parse(JSON.stringify(roadmap));
      const nextItem = nextRoadmap.items.find((_, index) => index === dragging);
      for (var x in nextItem.dateFields) {
        if (
          !sameMonth(nextItem.dateFields[x].date, dropTarget.toISOString()) &&
          sameMonth(nextItem.dateFields[x].date, prevTarget.toISOString())
        ) {
          nextItem.dateFields[x].date = dropTarget.toISOString();
          nextItem[`DateTarget${x}`] = nextItem.dateFields[x].date;
        }
      }
      event.dataTransfer.clearData();
      setRoadmap(nextRoadmap);
      setDragging(undefined);
      setDropTarget(undefined);
      setPrevTarget(undefined);
      update(nextRoadmap, password)
        .then(() => {
          // ???
        })
        .catch((status) => {
          if (status === 401) setAuth(true);
        });
    },
    [dragging, dropTarget, prevTarget, password, roadmap],
  );

  if (auth)
    return (
      <Auth
        onChange={(nextPassword) => {
          setPassword(nextPassword);
          setAuth(false);
        }}
      />
    );

  if (!roadmap)
    return (
      <Box fill align="center" justify="center" pad="xlarge">
        <Box animation={['fadeIn', 'pulse']}>
          <Navigate />
        </Box>
      </Box>
    );

  const Month = ({ month, items }) => {
    const onDragEnter = (event) => {
      if (dragging !== undefined) {
        event.preventDefault();
        setDropTarget(month);
      } else {
        setDropTarget(undefined);
      }
    };

    const onDragOver = (event) => {
      if (dragging !== undefined) event.preventDefault();
    };

    return (
      <Box
        gap="medium"
        pad={{ vertical: 'medium', horizontal: 'small' }}
        background="background-contrast"
        responsive={false}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDrop={moveItem}
      >
        {items.map((item) => (
          <Item key={item.name} month={month} {...item} />
        ))}
      </Box>
    );
  }; // Month

  const Item = ({ dateFields, index, linkFields, month, name, note }) => {
    const labels = [];
    for (var x in dateFields) {
      const stage = dateFields[x].stage;
      labels.push(roadmap.labels.find(({ name }) => name === stage));
    }

    const onDragStart = (event) => {
      // for Firefox
      event.dataTransfer.setData('text/plain', '');
      setDragging(index);
      setPrevTarget(month);
    };

    const onDragEnd = () => {
      setDragging(undefined);
      setDropTarget(undefined);
      setPrevTarget(undefined);
    };

    let content = (
      <Card background="background-front" elevation="small">
        <CardBody justify="between" direction="row" gap="medium" pad="medium">
          <Box flex>
            <Heading margin="none" size="small" level={4}>
              {name}
            </Heading>
            {note && (
              <Paragraph size="small" margin={{ bottom: 'none' }}>
                {note}
              </Paragraph>
            )}
          </Box>
          <Box flex={false} gap="small">
            {linkFields
              .filter(({ linkUrl }) => linkUrl)
              .map(({ linkUrl }) => (
                <Box key={linkUrl} align="center">
                  <Button
                    plain
                    icon={<LinkIcon url={linkUrl} />}
                    href={linkUrl}
                  />
                </Box>
              ))}
          </Box>
        </CardBody>
        {dateFields
          .filter((dateField) => sameMonth(month, dateField.date))
          .map((dateField, index) => (
            <CardFooter
              key={dateField.stage}
              pad={{
                vertical: 'small',
                horizontal: 'medium',
              }}
              background={(labels[index] && labels[index].color) || ''}
            >
              <Text size="small" weight="bold" key={`${index}stage`}>
                {dateField.stage}
              </Text>
              <Text size="small" weight="bold" key={`${index}progress`}>
                {dateField.progress}
              </Text>
            </CardFooter>
          ))}
      </Card>
    );
    if (editing)
      content = (
        <Stack guidingChild="first" interactiveChild="last">
          {content}
          <Button
            fill
            plain
            hoverIndicator
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => setItemIndex(index)}
          >
            <Box fill align="center" justify="start" pad="xsmall">
              <More />
            </Box>
          </Button>
        </Stack>
      );
    return content;
  }; // Item

  const Name = () => {
    let content = (
      <Heading textAlign="center" size="small" margin="none">
        {roadmap.name}
      </Heading>
    );
    if (editing)
      content = (
        <Button plain hoverIndicator onClick={() => setEditRoadmap(true)}>
          <Box
            direction="row"
            align="center"
            gap="small"
            pad={{ horizontal: 'xsmall' }}
          >
            <Blank />
            {content}
            <FormDown />
          </Box>
        </Button>
      );
    return content;
  };

  return (
    <ThemeContext.Extend value={themes[roadmap.theme] || themes.grommet}>
      <Keyboard
        target="document"
        onRight={!editing ? onNext : undefined}
        onLeft={!editing ? onPrevious : undefined}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === '.') {
            event.preventDefault();
            setEditing(!editing);
          }
        }}
      >
        <Swipe fill onSwipeLeft={onNext} onSwipeRight={onPrevious} gap="small">
          <Header pad="small">
            <Button icon={<Navigate />} onClick={onClose} />
            <Box direction="row" gap="small">
              <Name />
            </Box>
            {(editing && (
              <Button icon={<Add />} onClick={() => setItemIndex(-1)} />
            )) ||
              (roadmap.notes && (
                <Button
                  icon={<CircleInformation />}
                  onClick={() => setShowNotes(!showNotes)}
                />
              )) || <Button disabled icon={<Blank />} />}
          </Header>
          <Box flex={false}>
            {showNotes && (
              <Grid
                columns={[
                  'flex',
                  ['small', responsive === 'medium' ? 'xlarge' : '80vw'],
                  'flex',
                ]}
              >
                <Box />
                <Box pad="small" fill>
                  <Markdown>{roadmap.notes}</Markdown>
                </Box>
                <Box />
              </Grid>
            )}
            <Row>
              {months.map((month, index) => (
                <Box key={month} direction="row" align="end" justify="between">
                  {index === 0 ? (
                    <Button
                      icon={<Previous />}
                      hoverIndicator
                      onClick={onPrevious}
                    />
                  ) : (
                    <Blank />
                  )}
                  <Box align="center">
                    <Text color="text-weak">
                      {month.toLocaleString(undefined, { year: 'numeric' })}
                    </Text>
                    <Heading level={2} size="small" margin="none">
                      {month.toLocaleString(undefined, { month: 'long' })}
                    </Heading>
                  </Box>
                  {index === months.length - 1 ? (
                    <Button icon={<Next />} hoverIndicator onClick={onNext} />
                  ) : (
                    <Blank />
                  )}
                </Box>
              ))}
            </Row>
          </Box>
          <Box flex overflow="auto" pad={{ bottom: 'medium' }}>
            {Object.values(sections).map(({ name, months }) => (
              <Box flex={false} key={name || 'none'}>
                <Row>
                  <Heading level={3} size="xsmall" margin="small">
                    {name}
                  </Heading>
                </Row>
                <Row>
                  {months.map((month) => (
                    <Month key={month.month} {...month} />
                  ))}
                </Row>
              </Box>
            ))}
            <Footer justify="end" pad="medium">
              <Menu
                title="theme mode"
                icon={<Sun />}
                dropAlign={{ bottom: 'top', right: 'right' }}
                items={['light', 'dark', 'auto'].map((mode) => ({
                  label: mode,
                  onClick: () => onThemeMode(mode),
                }))}
              />
            </Footer>
          </Box>
          {itemIndex !== undefined && (
            <ItemEdit
              index={itemIndex}
              roadmap={roadmap}
              onChange={setRoadmap}
              onDone={() => setItemIndex(undefined)}
            />
          )}
          {editRoadmap && (
            <RoadmapEdit
              roadmap={roadmap}
              onChange={(nextRoadmap) => {
                if (nextRoadmap) setRoadmap(nextRoadmap);
                else onClose();
              }}
              onDone={() => setEditRoadmap(false)}
            />
          )}
          {editing && (
            <Box align="center" pad="xsmall" background="status-warning">
              <Text size="large">editing</Text>
            </Box>
          )}
        </Swipe>
      </Keyboard>
    </ThemeContext.Extend>
  );
};

export default Roadmap;
