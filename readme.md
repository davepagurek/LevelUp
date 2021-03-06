<h1>Level Up</h1>
<h2>Level Converter and Averager by <a href="http://www.davepagurek.com">Dave Pagurek</a></h2>
<h3>What This Does</h3>
<p>It reads in a comma-deliminated CSV file in the following format:</p>
<table>
  <tr><th>Type</th><th>a</th><th>O.A1</th><th>pA</th><th>pP</th><th>O.A2</th><th>q1</th><th>q1</th><th>O.A3</th><th>t3</th><th>t3</th><th>t3</th><th>S1</th><th>S2</th><th>E1</th><th>E2</th><th>E3</th></tr>
  <tr><td>Lastname</td><td>Firstname</td><td>4</td><td>4+</td><td>4-</td><td>3</td><td>3-</td><td>3+</td><td>3</td><td>2</td><td>4-</td><td>3</td><td>4+</td><td>3+</td><td>A</td><td>A</td><td>A</td></tr>
</table>
<p>Then, it calculates averages for each student row according to the following criteria:</p>
<ol>
  <li>All rows that come before the word "Type" are ignored</li>
  <li>All columns that are not O.As, Es or Ss are ignored</li>
  <li>All levels are converted to percentages</li>
  <li>An exam mark is calculated from the average of all E* marks</li>
  <li>A summative mark is calculated from the average of all S* marks</li>
  <li>A (pre-exam) term mark is calculated from the average of all O.A* marks</li>
  <li>A post-exam term mark is calculated from the average of all O.A* marks, but where O.A<em>x</em> is replaced with E<em>x</em> if E<em>x</em> is a higher grade than O.A<em>x</em>.</li>
  <li>An "old" final mark is calculated using the pre-exam term mark as 70%, summative as 10% and exam as 20%. If either a summative or exam exists but not both, the existing one is worth 30%. If neither exist, the pre-exam term mark is worth 100%.</li>
  <li>An final mark is calculated using the post-exam term mark as 70%, summative as 10% and exam as 20%. If either a summative or exam exists but not both, the existing one is worth 30%. If neither exist, the post-exam term mark is worth 100%.</li>
</ol>
<h3>How Marks are Converted</h3>
<p>All levels written forwards (e.g. 4-) or reverse (e.g. -4) are run through this conversion table. The program will throw an error if a match in the table is not found.</p>
<table>
  <tr><th>Level</th><th>X--</th><th>X-</th><th>X</th><th>X+</th><th>X++</th></tr>
  <tr><td>A</td><td>&nbsp;</td><td>&nbsp;</td><td>(ignored)</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>B</td><td>&nbsp;</td><td>&nbsp;</td><td>0</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  <tr><td>R</td><td>&nbsp;</td><td>25</td><td>35</td><td>45</td><td>&nbsp;</td></tr>
  <tr><td>1</td><td>&nbsp;</td><td>52</td><td>55</td><td>58</td><td>&nbsp;</td></tr>
  <tr><td>2</td><td>&nbsp;</td><td>62</td><td>65</td><td>68</td><td>&nbsp;</td></tr>
  <tr><td>3</td><td>&nbsp;</td><td>72</td><td>75</td><td>78</td><td>&nbsp;</td></tr>
  <tr><td>4</td><td>80</td><td>85</td><td>90</td><td>95</td><td>100</td></tr>
  <tr><td>5</td><td>&nbsp;</td><td>&nbsp;</td><td>100</td><td>&nbsp;</td><td></td></tr>
</table>
