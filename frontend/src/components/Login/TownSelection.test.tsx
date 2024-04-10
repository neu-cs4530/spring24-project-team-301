/* eslint-disable no-await-in-loop,@typescript-eslint/no-loop-func,no-restricted-syntax */
import { ChakraProvider } from '@chakra-ui/react';
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, RenderResult, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mock, mockClear, MockProxy, mockReset } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import * as TownController from '../../classes/TownController';
import { LoginController } from '../../contexts/LoginControllerContext';
import { CancelablePromise, Town, TownsService } from '../../generated/client';
import * as useLoginController from '../../hooks/useLoginController';
import { mockTownController } from '../../TestUtils';
import TownSelection from './TownSelection';

const mockConnect = jest.fn(() => Promise.resolve());

const mockToast = jest.fn();
jest.mock('../VideoCall/VideoFrontend/hooks/useVideoContext/useVideoContext.ts', () => ({
  __esModule: true, // this property makes it work
  default: () => ({ connect: mockConnect }),
}));
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
function toCancelablePromise<T>(p: T): CancelablePromise<T> {
  return new CancelablePromise(async resolve => {
    resolve(p);
  });
}
const listTowns = (suffix: string) =>
  toCancelablePromise(
    [
      {
        friendlyName: `town1${suffix}`,
        townID: `1${suffix}`,
        currentOccupancy: 0,
        maximumOccupancy: 1,
      },
      {
        friendlyName: `town2${suffix}`,
        townID: `2${suffix}`,
        currentOccupancy: 2,
        maximumOccupancy: 10,
      },
      {
        friendlyName: `town3${suffix}`,
        townID: `3${suffix}`,
        currentOccupancy: 1,
        maximumOccupancy: 1,
      },
      {
        friendlyName: `town4${suffix}`,
        townID: `4${suffix}`,
        currentOccupancy: 8,
        maximumOccupancy: 8,
      },
      {
        friendlyName: `town5${suffix}`,
        townID: `5${suffix}`,
        currentOccupancy: 9,
        maximumOccupancy: 5,
      },
      {
        friendlyName: `town6${suffix}`,
        townID: `6${suffix}`,
        currentOccupancy: 99,
        maximumOccupancy: 100,
      },
    ]
      .map(a => ({
        sort: Math.random(),
        value: a,
      }))
      .sort((a, b) => a.sort - b.sort)
      .map(a => a.value),
  );

export function wrappedTownSelection() {
  return (
    <ChakraProvider>
      <TownSelection />
    </ChakraProvider>
  );
}

describe('Town Selection', () => {
  let mockTownsService: MockProxy<TownsService>;
  let useLoginControllerSpy: jest.SpyInstance<LoginController, []>;
  let mockLoginController: MockProxy<LoginController>;
  let coveyTownControllerConstructorSpy: jest.SpyInstance<
    TownController.default,
    [TownController.ConnectionProperties]
  >;
  let mockedTownController: MockProxy<TownController.default>;
  const expectedProviderVideoToken = nanoid();

  beforeAll(() => {
    mockTownsService = mock<TownsService>();
    useLoginControllerSpy = jest.spyOn(useLoginController, 'default');
    mockLoginController = mock<LoginController>();
    mockLoginController.townsService = mockTownsService;

    mockedTownController = mockTownController({ providerVideoToken: expectedProviderVideoToken });

    coveyTownControllerConstructorSpy = jest.spyOn(TownController, 'default');
  });
  beforeEach(() => {
    jest.useFakeTimers();
    mockReset(mockTownsService);
    mockClear(useLoginControllerSpy);
    mockClear(mockLoginController);
    mockClear(mockedTownController);
    mockClear(coveyTownControllerConstructorSpy);
    useLoginControllerSpy.mockReturnValue(mockLoginController);
    coveyTownControllerConstructorSpy.mockReturnValue(mockedTownController);
    mockedTownController.connect.mockReturnValue(Promise.resolve());
  });
  describe('Listing public towns', () => {
    it('is called when rendering (hopefully by a useeffect, this will be checked manually)', async () => {
      jest.useRealTimers();
      mockTownsService.listTowns.mockImplementation(() => listTowns(nanoid()));
      const renderData = render(wrappedTownSelection());
      await waitFor(
        () => {
          expect(mockTownsService.listTowns).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 },
      );
      renderData.unmount();
    });
    it('updates every 2000 msec', async () => {
      mockTownsService.listTowns.mockImplementation(() => listTowns(nanoid()));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(1);
      });
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(2);
      });
      jest.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(2);
      });
      renderData.unmount();
    });
    it('stops updating when unmounted', async () => {
      mockTownsService.listTowns.mockImplementation(() => listTowns(nanoid()));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(1);
      });
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(2);
      });
      renderData.unmount();
      jest.advanceTimersByTime(10000);
      await waitFor(() => {
        expect(mockTownsService.listTowns).toBeCalledTimes(2);
      });
    });
    it('updates the page with all towns stored in currentPublicTowns', async () => {
      const suffix1 = nanoid();
      const suffix2 = nanoid();
      const expectedTowns1 = await listTowns(suffix1);
      const expectedTowns2 = await listTowns(suffix2);
      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix1));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expectedTowns1.map(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        );
      });
      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix2));
      jest.advanceTimersByTime(2000);
      await waitFor(() => {
        expectedTowns2.forEach(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        );
        expectedTowns1.forEach(town =>
          expect(renderData.queryByText(town.friendlyName)).not.toBeInTheDocument(),
        );
      });
    });
    it('does not include the hardcoded demo in the listing', async () => {
      const suffix = nanoid();
      const expectedTowns1 = await listTowns(suffix);
      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expectedTowns1.map(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        );
      });
      expect(renderData.queryByText('demoTownName')).not.toBeInTheDocument();
    });
    it('sorts towns by occupancy descending', async () => {
      const suffix1 = nanoid();
      const suffix2 = nanoid();
      let expectedTowns1 = await listTowns(suffix1);
      expectedTowns1 = expectedTowns1.sort((a, b) => b.currentOccupancy - a.currentOccupancy);

      let expectedTowns2 = await listTowns(suffix2);
      expectedTowns2 = expectedTowns2.sort((a, b) => b.currentOccupancy - a.currentOccupancy);

      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix1));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expectedTowns1.map(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        );
      });
      // All towns are in doc, now make sure they are sorted by occupancy
      let rows = renderData.getAllByRole('row');
      for (let i = 1; i < rows.length; i += 1) {
        // off-by-one for the header row
        const existing = within(rows[i]).getByText(expectedTowns1[i - 1].friendlyName);
        expect(existing).toBeInTheDocument();
        for (let j = 0; j < expectedTowns1.length; j += 1) {
          if (j !== i - 1) {
            expect(
              within(rows[i]).queryByText(expectedTowns1[j].friendlyName),
            ).not.toBeInTheDocument();
          }
        }
      }
      // Now, do that all again to make sure it sorts EVERY run
      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix2));
      jest.advanceTimersByTime(2000);
      await waitFor(() =>
        expectedTowns2.map(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        ),
      );

      // All towns are in doc, now make sure they are sorted by occupancy
      rows = renderData.getAllByRole('row');
      for (let i = 1; i < rows.length; i += 1) {
        // off-by-one for the header row
        // console.log(rows[i]);
        const existing = within(rows[i]).getByText(expectedTowns2[i - 1].friendlyName);
        expect(existing).toBeInTheDocument();
        for (let j = 0; j < expectedTowns2.length; j += 1) {
          if (j !== i - 1) {
            expect(
              within(rows[i]).queryByText(expectedTowns2[j].friendlyName),
            ).not.toBeInTheDocument();
          }
        }
      }
    });
    it('represents each row in the table as specified', async () => {
      const suffix1 = nanoid();
      let expectedTowns = await listTowns(suffix1);
      expectedTowns = expectedTowns.sort((a, b) => b.currentOccupancy - a.currentOccupancy);
      mockTownsService.listTowns.mockImplementation(() => listTowns(suffix1));
      const renderData = render(wrappedTownSelection());
      await waitFor(() => {
        expectedTowns.forEach(town =>
          expect(renderData.getByText(town.friendlyName)).toBeInTheDocument(),
        );
      });
      const rows = renderData.getAllByRole('row');
      expectedTowns.forEach(town => {
        const row = rows.find(each => within(each).queryByText(town.townID));
        if (row) {
          const cells = within(row).queryAllByRole('cell');
          // Cell order: friendlyName, TownID, occupancy/join + button
          expect(cells.length).toBe(3);
          expect(within(cells[0]).queryByText(town.friendlyName)).toBeInTheDocument();
          expect(within(cells[1]).queryByText(town.townID)).toBeInTheDocument();
          expect(
            within(cells[2]).queryByText(`${town.currentOccupancy}/${town.maximumOccupancy}`),
          ).toBeInTheDocument();
        } else {
          fail(`Could not find row for town ${town.townID}`);
        }
      });
    });
  });
});
