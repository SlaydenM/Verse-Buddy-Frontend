import { Group } from "next/dist/shared/lib/router/utils/route-regex";

interface GroupPair {
  name: string;
  data: any;
  format?: Record<string, boolean>
}

interface SpecialRequestCount {
  count: number;
  request?: string | null;
}

interface RawRow {
  menuItemRaw: string;
  side1?: string;
  side2?: string;
  special?: string;
}

interface SummaryRow {
  regular: number;
  special: SpecialRequestCount[];
  gather: number;
  hasGather: boolean;
}

// I couldn't implement this in typeScript due to iteration issues, i'll make it work in VBA
// interface GroupedDataProps { 
//   [index: string]: GroupPair<
//     [index: string]: GroupPair<
//        [index: number]: RawRow
//     >
//   >
// }

interface SummaryDataProps {
  [day: string]: Record<string, SummaryRow>;
}

const menuItemAlias: Record<string, Record<string, any>> = {
  "Turkey & Cheese Sandwich":	{
    name: "Turkey",
    countGather: true,
    countTotal: false
  },
  "Ham & Cheese Sandwich": {
    name: "Ham",
    countGather: true,
    countTotal: false
  },
  "Chicken Salad Sandwich":	{
    name: "Chickie Hug",
    countGather: false,
    countTotal: false
  },
  "BLT": {
    name: "BLT",
    countGather: false,
    countTotal: false
  },
  "Peach Gobbler": {
    name: "Peach Gobbler",
    countGather: false,
    countTotal: false
  },
  "Veg It Up": {
    name: "VEG IT UP",
    countGather: false,
    countTotal: false
  },
  "Chef Salad": {
    name: "Chef Salad",
    countGather: false,
    countTotal: true
  },
  "Chicken & Strawberry Salad": {
    name: "Strawberry Salad",
    countGather: false,
    countTotal: true
  }
}

// Mock data for groupedData (passed as parameter)
/*const groupedData = [
  { // Group pair
    name: "Monday",
    data: [
      { // GroupPair
        name: "Ham",
        data: [
          { // RawRow
            menuItemRaw: "Ham & Cheese Sandwich (Half)",
            side1: "Cookie",
            special: "No Tomato"
          },
          {
            menuItemRaw: "Ham & Cheese Sandwich (Whole)",
            side1: "Cookie"
          },
        ],
      },
      {
        name: "Chickie Hug",
        data: [
          {
            menuItemRaw: "Chicken Salad Sandwich (Whole)",
            side1: "Fruit",
            side2: "Cookie",
            special: "No Lettuce"
          }
        ]
      }
    ]
  },
  { // Group pair
    name: "Tuesday",
    data: [
      { // Group pair
        name: "Ham",
        data: [
          {
            menuItemRaw: "Ham & Cheese Sandwich (Whole)",
            side1: "Fruit",
            side2: "Veggie Sticks"
          },
        ],
        format: {
          countGather: true,
          countTotal: false
        }
      },
      {
        name: "BLT",
        data: [
          {
            menuItemRaw: "BLT (Whole)",
            side1: "Chips",
            special: "No Cheese"
          },
          {
            menuItemRaw: "BLT (Half)",
            side1: "Fruit",
            special: "No Cheese"
          },
        ]
      }
    ]
  }
]*/

function initializeSummaryData(groupedData: GroupPair[]): SummaryDataProps {
  const summaryData: SummaryDataProps = {}
  const days: string[] = []
  const menuItems: string[] = []
  const sides: string[] = [
    "Chips",
    "Cookie",
    "Fruit",
    "Veggie Sticks"	
  ]
  const gatherBools: Record<string, boolean> = {}
  
  // Get menu item list
  groupedData.forEach((gpDay: GroupPair) => {
    const day: string = gpDay.name
    
    // Add day to list
    days.push(day)
    
    // Loop through the menu item types
    gpDay.data.forEach((gpMenu: GroupPair) => {
      const menuItem: string = gpMenu.name
      
      // Add menu item to list if it isn't present
      if (!menuItems.includes(menuItem)) {
        menuItems.push(menuItem)
        gatherBools[menuItem] = !!(gpMenu.format?.countGather || gpMenu.format?.countTotal) // Add gather to item
      }
    });
  });
  
  // Fill summaryData
  days.forEach((day: string) => {
    const summaryItemList: Record<string, SummaryRow> = {}
    
    // Add menu items
    menuItems.forEach((menuItem: string) => {
      // Add entry to item list
      summaryItemList[menuItem] = {
        regular: 0,
        special: [] as SpecialRequestCount[],
        gather: 0,
        hasGather: gatherBools[menuItem] // Initialize
      } as SummaryRow
    });
    
    // Add sides
    sides.forEach((menuItem: string) => {
      // Add entry to item list
      summaryItemList[menuItem] = {
        regular: 0,
        special: [] as SpecialRequestCount[],
        gather: 0,
        hasGather: true // Always gather sides
      } as SummaryRow
    });
    
    // Pair day with item list
    summaryData[day] = summaryItemList
  });
  
  return summaryData;
}

// Initialize summaryData as empty rows
/*const summaryData: SummaryDataProps = {
  "Monday": { //day
    "Ham": {//menuItem
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Chickie Hug": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Chips": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Cookie": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Fruit": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Veggie Sticks": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
  },
  "Tuesday": {
    "Ham": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "BLT": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Chips": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Cookie": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Fruit": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
    "Veggie Sticks": {
      regular: 0,
      special: [] as SpecialRequestCount[],
      gather: 0
    } as SummaryRow,
  },
}*/

function processMeal(meal: RawRow, summaryItem: SummaryRow, summaryItemList: Record<string, SummaryRow>) {  
  // Parse for portion size
  const size: string = (meal.menuItemRaw.includes("("))
    ? meal.menuItemRaw.split('(')[1]?.replace(')', '').trim().toLowerCase() // Get string in parenthesis
    : "";
  
  // Fill regular/special fields based on portion
  if (meal?.special) { // If meal has special field and it is filled
    // Special
    // If request already exists
    let isExisting = false
    const srList = summaryItem.special.filter((sr: SpecialRequestCount) => {
      if (meal.special?.trim() === sr.request?.trim()) {
        isExisting = true
        return true
      }
      return false
    })
    
    // Define request
    if (isExisting) {
      const sr = srList[0] // First in existing list
      
      // Update count
      sr.count += (size === 'half') ? 0.5 : 1; 
    } else {
      const sr = { // New request
        count: (size === 'half') ? 0.5 : 1, // Set count
        request: meal.special
      }
      
      // Add to special request list
      summaryItem.special.push(sr)
    }
  } else { 
    // Regular
    summaryItem.regular += (size === 'half') ? 0.5 : 1;
  }
  
  // Count sides and place in their rows
  if (meal.side1 && summaryItemList[meal.side1]) {
    summaryItemList[meal.side1].gather = (summaryItemList[meal.side1].gather || 0) + 1;
  }
  if (meal.side2 && summaryItemList[meal.side2]) {
    summaryItemList[meal.side2].gather = (summaryItemList[meal.side2].gather || 0) + 1;
  }
}

// Loop through each day
function processGroupedData(groupedData: GroupPair[]): SummaryDataProps {
  // Create empty data structure
  const summaryData = initializeSummaryData(groupedData);
  
  // Fill summary data
  groupedData.forEach((gpDay: GroupPair) => {
    const day: string = gpDay.name
    const summaryItemList: Record<string, SummaryRow> = summaryData[day];
    
    // Loop through the menu item types
    gpDay.data.forEach((gpMenu: GroupPair) => {
      const menuItem: string = gpMenu.name
      const summaryItem: SummaryRow = summaryItemList[menuItem];
      
      // Loop through the meals
      gpMenu.data.forEach((meal: RawRow) => {
        processMeal(meal, summaryItem, summaryItemList)
      });
      
      // Count special
      const specialCount = (summaryItem.special // special requests
        .map((si: SpecialRequestCount) => si.count) // Counts
        .reduce((acc, curr) => acc + curr, 0)) // Summed up
      
      // Count gather
      if (gpMenu.format?.countGather) {
        summaryItem.gather = Math.ceil(summaryItem.regular + specialCount);
      } else { // Count total
        summaryItem.gather = summaryItem.regular + specialCount;
      }
      
      // Include peach gobbler in turkey gather count
      if (menuItem === "Peach Gobbler") {
        summaryItemList["Turkey"].gather = Math.ceil(
          summaryItemList["Turkey"].gather || 0 + summaryItem.regular + specialCount
        );
      }
    });
  });
  
  console.log(JSON.stringify(summaryData))
  
  return summaryData
}





const groupedByDay = [
  {
    name: "JULY 29 - TUESDAY",
    data: [
      ["JULY 29 - TUESDAY", "Ham & Cheese Sandwich (Half)", "Veggie Sticks", "", "no cheese"]
    ]
  },
  {
    name: "JULY 30 - WEDNESDAY",
    data: [
      ["JULY 30 - WEDNESDAY",	"Weekly Special (Half)", "Fruit", "Cookie"],
      ["JULY 30 - WEDNESDAY",	"BLT (Half)"],
    ]
  },
  {
    name: "JULY 31 - THURSDAY",
    data: [
      ["JULY 31 - THURSDAY", "Ham & Cheese Sandwich (Half)", "Chips", "Fruit", "no buns"],
      ["JULY 31 - THURSDAY", "Ham & Cheese Sandwich (Whole)", "Cookie", "", "no buns"],
      ["JULY 31 - THURSDAY", "Chicken & Strawberry Salad",	"Cookie"]
    ]
  },
  {
    name: "August 1 - FRIDAY",
    data: [
      ["August 1 - FRIDAY", "BLT (Half)", "Chips", "Fruit", "no lettuce"],
      ["August 1 - FRIDAY", "BLT (Whole)", "Cookie", "", "no buns"],
    ]
  },
]

function groupByMenuItem(data: Array<GroupPair>)  {
  const resultData: Array<GroupPair> = Array()
  
  data.forEach((gpDay: GroupPair) => {
    // Create empty dictionary of arrays
    const resultMenuItems: GroupPair[] = []
    Object.values(menuItemAlias).forEach((alias) => {
      resultMenuItems.push({
        name: alias.name,
        data: Array(),
        format: {
          countGather: alias.countGather,
          countTotal: alias.countTotal
        }
      })
    })
    
    // Loop through the menu item types
    gpDay.data.forEach((row: Array<any>) => {
      // Process name to sort by
      const menuItemRaw = row[1]
      const menuItemKey = (menuItemRaw.includes("("))
        ? menuItemRaw.split('(')[0].trim() // Get item before parenthesis
        : menuItemRaw
      
      // Get alias
      let menuItem: string = ""
      if (Object.keys(menuItemAlias).includes(menuItemKey)) {// If special menu item
        menuItem = menuItemAlias[menuItemKey]?.name // Look up menu item name for the summary
      } else {
        menuItem = menuItemKey // no alias
        
        resultMenuItems.push({ // Create new menu item for this iteration
          name: menuItem,
          data: Array(),
          format: {
            countGather: false,
            countTotal: true // Count total for special items
          }
        })
      }
      
      // Process other row data
      const side1 = row[2]
      const side2 = row[3]
      const special = row[4]
      
      // Add row to group
      console.log("Menu Item: ", `(${menuItem})`)
      resultMenuItems.values().some((rmi) => {
        if (rmi.name === menuItem) { // Sort based on name
          rmi.data.push({ // Insert new row of this item type
            menuItemRaw,
            side1,
            side2,
            special
          })
          return true // Stop iterating
        }
        return false // Continue iterating
      })
    });
    
    // Add group to day
    const resultDay: GroupPair = {
      name: gpDay.name,
      data: resultMenuItems
    }
    resultData.push(resultDay)
  });
  
  return resultData;
}

function generateRows(summaryData: Record<string, Record<string, SummaryRow>>): string[][] {
  const rowsList: string[][] = [["Summary Table"]]
  const days: string[] = []
  const menuItems: string[] = []
  const sides: string[] = [
    "Bacon",
    "Chips",
    "Cookie",
    "Fruit",
    "Veggie Sticks"
  ]
  
  // Data for all days
  Object.entries(summaryData).forEach(([day, summaryItemList]) => {
    // Add day to list
    days.push(day)
    
    // Header row for day
    rowsList.push([
      day,
      "Regular",
      "Special Requests",
      "Gather"
    ])
    
    // Data for day
    Object.entries(summaryItemList).forEach(([menuItem, summaryRow]) => {
      // Add menu item to list if it isn't present
      if (!menuItems.includes(menuItem)) {
        menuItems.push(menuItem)
      }
      
      // Format special request list
      const specialList: string = summaryRow.special.map((sr) => {
        return sr.count.toString() + " - " + (sr.request || "Unknown Request")
      }).join(" ")
      
      // Format fields to show or not
      const regularField = (!sides.includes(menuItem)) // Don't show on sides
        ? summaryRow.regular.toString()
        : "x"
      const specialField = (!sides.includes(menuItem)) // Don't show on sides
        ? specialList
        : "x"
      const gatherField = (summaryRow.hasGather) // Only show visible totals
        ? (summaryRow.gather.toString())
        : "x"
      
      // Menu item data
      rowsList.push([
        menuItem,
        regularField,
        specialField,
        gatherField
      ])
    })
  })
  
  // Add bacon
  menuItems.push("Bacon")
  
  // Total data
  rowsList.push([]) // Empty row
  rowsList.push([ // Header
    "COUNTS",
    ...days,
    "TOTAL"
  ])
  menuItems.forEach((menuItem: string) => {
    if (menuItem == "Bacon" || summaryData[days[0]][menuItem].hasGather) { // Only include visible totals
      const newRow: string[] = [menuItem];
      let count = 0;
      
      // Data for day
      days.forEach((day) => {
        const gatherNum = (menuItem == "Bacon")
            ? summaryData[day]["BLT"].gather + summaryData[day]["Peach Gobbler"].gather // Add totals of other items that include bacon
            : summaryData[day][menuItem].gather // Self total
        count += gatherNum;
        
        // Add total for that day (only for sides)
        newRow.push((sides.includes(menuItem.trim()))
          ? gatherNum.toString()
          : "x"
        )
      })
      
      // Add to row
      newRow.push(count.toString())
      rowsList.push(newRow)
    }
  })
  
  return rowsList
}

const gbmi = groupByMenuItem(groupedByDay)
const pgd = processGroupedData(gbmi)
const gr = generateRows(pgd)

console.log(JSON.stringify(pgd))

export default function printData()  {
  return (
    <pre>
      {JSON.stringify(pgd, null, 4)}
      {JSON.stringify(gr, null, 4)}
    </pre>
  );
}
