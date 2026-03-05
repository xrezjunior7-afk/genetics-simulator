'use client'

import { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Dna, 
  Sparkles,
  ChevronRight,
  Eye,
  Lightbulb,
  Users
} from 'lucide-react'

interface ProjectData {
  subjects: Subject[]
}

interface Subject {
  id: string
  name: string
  description: string
  baseImage: string
  traits: Trait[]
}

interface Trait {
  name: string
  defaultSymbols: { dominant: string; recessive: string }
  options: PhenotypeOption[]
}

interface PhenotypeOption {
  phenotype: string
  image: string
  description: string
}

interface GenerationResult {
  label: string
  parent1Genotype: string
  parent2Genotype: string
  outcomes: { genotype: string; count: number }[]
  phenotypeCounts: { dominant: number; recessive: number }
  domSymbol: string
  recSymbol: string
  domPhen: string
  recPhen: string
}

interface MonohybridModuleProps {
  data: ProjectData
  onBack: () => void
  onCrossComplete: (generation: number) => void
}

export function MonohybridModule({ data, onBack, onCrossComplete }: MonohybridModuleProps) {
  const [selectedOrganism, setSelectedOrganism] = useState<Subject | null>(null)
  const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null)
  const [dominantFirst, setDominantFirst] = useState(true)
  const [domSymbol, setDomSymbol] = useState('')
  const [recSymbol, setRecSymbol] = useState('')
  const [parent1Phenotype, setParent1Phenotype] = useState<string>('')
  const [parent2Phenotype, setParent2Phenotype] = useState<string>('')
  const [generations, setGenerations] = useState<GenerationResult[]>([])
  const [nextParents, setNextParents] = useState<{ geno: string; phen: string; origin: string } | null>(null)
  
  // Track if simulation has started to enable auto-reset on config change
  const simulationStartedRef = useRef(false)

  // Auto-reset when configuration changes after simulation started
  useEffect(() => {
    // Only reset if simulation has already started and results exist
    if (simulationStartedRef.current && generations.length > 0) {
      setGenerations([])
      setNextParents(null)
    }
  }, [dominantFirst, domSymbol, recSymbol, parent1Phenotype, parent2Phenotype])

  // Mark simulation as started when user clicks simulate
  const handleSimulate = () => {
    if (!parent1Genotype || !parent2Genotype) return
    simulationStartedRef.current = true
    const result = createPunnett(parent1Genotype, parent2Genotype, 'F1')
    setGenerations([result])
    onCrossComplete(1)
  }

  const dominantPhenotype = useMemo(() => {
    if (!selectedTrait) return null
    return dominantFirst ? selectedTrait.options[0] : selectedTrait.options[1]
  }, [selectedTrait, dominantFirst])

  const recessivePhenotype = useMemo(() => {
    if (!selectedTrait) return null
    return dominantFirst ? selectedTrait.options[1] : selectedTrait.options[0]
  }, [selectedTrait, dominantFirst])

  const parent1Genotype = useMemo(() => {
    if (!dominantPhenotype || !parent1Phenotype) return ''
    return parent1Phenotype === dominantPhenotype.phenotype 
      ? `${domSymbol}${domSymbol}` 
      : `${recSymbol}${recSymbol}`
  }, [dominantPhenotype, parent1Phenotype, domSymbol, recSymbol])

  const parent2Genotype = useMemo(() => {
    if (!recessivePhenotype || !parent2Phenotype) return ''
    return parent2Phenotype === dominantPhenotype?.phenotype 
      ? `${domSymbol}${domSymbol}` 
      : `${recSymbol}${recSymbol}`
  }, [recessivePhenotype, parent2Phenotype, domSymbol, recSymbol, dominantPhenotype])

  const handleOrganismChange = (value: string) => {
    const org = data.subjects.find(s => s.id === value)
    setSelectedOrganism(org || null)
    setSelectedTrait(null)
    setParent1Phenotype('')
    setParent2Phenotype('')
    setGenerations([])
    setNextParents(null)
  }

  const handleTraitChange = (value: string) => {
    const trait = selectedOrganism?.traits.find(t => t.name === value)
    if (trait) {
      setSelectedTrait(trait)
      setDomSymbol(trait.defaultSymbols.dominant)
      setRecSymbol(trait.defaultSymbols.recessive)
      setDominantFirst(true)
      setParent1Phenotype(trait.options[0].phenotype)
      setParent2Phenotype(trait.options[0].phenotype)
      setGenerations([])
      setNextParents(null)
    }
  }

  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) {
      const t = b
      b = a % b
      a = t
    }
    return a || 1
  }

  const sortPair = useCallback((a: string, b: string, dom: string): string => {
    if (a === b) return a + b
    if (a === dom && b !== dom) return a + b
    if (b === dom && a !== dom) return b + a
    return a < b ? a + b : b + a
  }, [])

  const createPunnett = useCallback((g1: string, g2: string, label: string): GenerationResult => {
    const p1 = [g1[0], g1[1]]
    const p2 = [g2[0], g2[1]]
    
    const outcomes: string[] = []
    p1.forEach(a => p2.forEach(b => outcomes.push(sortPair(a, b, domSymbol))))
    
    const tally: Record<string, number> = {}
    outcomes.forEach(g => tally[g] = (tally[g] || 0) + 1)
    
    const genotypeOutcomes = Object.entries(tally).map(([genotype, count]) => ({ genotype, count }))
    
    const domKey = `${domSymbol}${domSymbol}`
    const recKey = `${recSymbol}${recSymbol}`
    const hetKey = sortPair(domSymbol, recSymbol, domSymbol)
    
    const domCount = (tally[domKey] || 0) + (tally[hetKey] || 0)
    const recCount = tally[recKey] || 0
    
    return {
      label,
      parent1Genotype: g1,
      parent2Genotype: g2,
      outcomes: genotypeOutcomes,
      phenotypeCounts: { dominant: domCount, recessive: recCount },
      domSymbol,
      recSymbol,
      domPhen: dominantPhenotype?.phenotype || 'Dominan',
      recPhen: recessivePhenotype?.phenotype || 'Resesif'
    }
  }, [domSymbol, recSymbol, dominantPhenotype, recessivePhenotype, sortPair])

  const handleUseAsParent = (geno: string, phen: string, origin: string) => {
    if (!nextParents) {
      setNextParents({ geno, phen, origin })
    } else {
      const originIdx = generations.findIndex(g => g.label === nextParents.origin)
      const newOriginIdx = generations.findIndex(g => g.label === origin)
      const baseIdx = Math.max(originIdx, newOriginIdx)
      const newGenNum = baseIdx + 2
      const newLabel = `F${newGenNum}`
      
      const newResult = createPunnett(nextParents.geno, geno, newLabel)
      setGenerations(prev => [...prev.slice(0, baseIdx + 1), newResult])
      setNextParents(null)
      onCrossComplete(newGenNum)
    }
  }

  const handleReset = () => {
    setGenerations([])
    setNextParents(null)
  }

  const getGenCount = (result: GenerationResult, geno: string): number => {
    return result.outcomes.find(o => o.genotype === geno)?.count || 0
  }

  const simplifyRatio = (nums: number[]): string => {
    const validNums = nums.filter(n => n > 0)
    if (validNums.length === 0) return '0'
    const g = validNums.reduce((acc, n) => gcd(acc, n))
    return validNums.map(n => Math.round(n / g)).join(' : ')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali
            </Button>
            <div className="flex items-center gap-2">
              <Dna className="w-6 h-6" />
              <h1 className="text-xl font-bold">Persilangan Monohybrid</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Organism Selection */}
            <Card className="bg-white/90 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Pilih Organisme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedOrganism?.id || ''} onValueChange={handleOrganismChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih organisme..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data.subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOrganism && (
                  <p className="text-sm text-gray-500 mt-2">{selectedOrganism.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Trait Selection */}
            {selectedOrganism && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pilih Sifat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedTrait?.name || ''} onValueChange={handleTraitChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sifat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOrganism.traits.map(t => (
                          <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Trait Configuration */}
            {selectedTrait && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Konfigurasi Alel</CardTitle>
                    <CardDescription>Tentukan mana yang dominan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup 
                      value={dominantFirst ? 'first' : 'second'}
                      onValueChange={(v) => setDominantFirst(v === 'first')}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="first" id="first" />
                        <Label htmlFor="first" className="flex items-center gap-2">
                          <span className="font-medium">{selectedTrait.options[0].phenotype}</span>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Dominan</Badge>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="second" id="second" />
                        <Label htmlFor="second" className="flex items-center gap-2">
                          <span className="font-medium">{selectedTrait.options[1].phenotype}</span>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Dominan</Badge>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <Label className="text-xs text-gray-500">Simbol Dominan</Label>
                        <Input 
                          value={domSymbol} 
                          onChange={(e) => setDomSymbol(e.target.value.toUpperCase().slice(0, 1))}
                          maxLength={1}
                          className="text-center font-mono text-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Simbol Resesif</Label>
                        <Input 
                          value={recSymbol} 
                          onChange={(e) => setRecSymbol(e.target.value.toLowerCase().slice(0, 1))}
                          maxLength={1}
                          className="text-center font-mono text-lg"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Parent Selection */}
            {selectedTrait && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      Pilih Parent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium">Parent 1</Label>
                        <Select value={parent1Phenotype} onValueChange={setParent1Phenotype}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTrait.options.map(opt => (
                              <SelectItem key={opt.phenotype} value={opt.phenotype}>
                                {opt.phenotype}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <img 
                            src={parent1Phenotype === dominantPhenotype?.phenotype 
                              ? dominantPhenotype?.image 
                              : recessivePhenotype?.image} 
                            alt="Parent 1"
                            className="w-16 h-16 mx-auto object-contain"
                          />
                          <p className="text-xs font-mono mt-1">{parent1Genotype}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-medium">Parent 2</Label>
                        <Select value={parent2Phenotype} onValueChange={setParent2Phenotype}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTrait.options.map(opt => (
                              <SelectItem key={opt.phenotype} value={opt.phenotype}>
                                {opt.phenotype}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <img 
                            src={parent2Phenotype === dominantPhenotype?.phenotype 
                              ? dominantPhenotype?.image 
                              : recessivePhenotype?.image} 
                            alt="Parent 2"
                            className="w-16 h-16 mx-auto object-contain"
                          />
                          <p className="text-xs font-mono mt-1">{parent2Genotype}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSimulate}
                      disabled={!parent1Genotype || !parent2Genotype}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Simulasi
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {generations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Hasil Persilangan</h2>
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  {generations.map((result, genIdx) => (
                    <motion.div
                      key={result.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: genIdx * 0.2 }}
                      className="mb-6"
                    >
                      <Card className="bg-white/95 backdrop-blur shadow-lg">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Badge variant="default" className="bg-emerald-600">
                                  {result.label}
                                </Badge>
                                <span className="text-lg">
                                  {result.parent1Genotype} × {result.parent2Genotype}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                Tabel Punnett - Persilangan Monohybrid
                              </CardDescription>
                            </div>
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Punnett Grid */}
                          <div className="flex justify-center mb-6">
                            <div 
                              className="grid gap-1"
                              style={{ gridTemplateColumns: 'repeat(3, minmax(50px, 70px))' }}
                            >
                              {/* Header row */}
                              <div className="w-12 h-12"></div>
                              {[result.parent2Genotype[0], result.parent2Genotype[1]].map((h, i) => (
                                <div 
                                  key={`h-${i}`}
                                  className="w-14 h-12 flex items-center justify-center font-bold text-lg bg-teal-100 rounded-lg border-2 border-teal-200"
                                >
                                  {h}
                                </div>
                              ))}
                              {/* Data rows */}
                              {[result.parent1Genotype[0], result.parent1Genotype[1]].map((v, i) => (
                                [result.parent2Genotype[0], result.parent2Genotype[1]].map((h, j) => {
                                  const isFirst = j === 0
                                  const pair = sortPair(v, h, result.domSymbol)
                                  const isDom = pair.includes(result.domSymbol)
                                  return (
                                    <div 
                                      key={`${i}-${j}`}
                                      className={`w-14 h-14 flex items-center justify-center font-mono text-lg rounded-lg border-2 ${
                                        isFirst ? 'ml-0' : ''
                                      } ${isDom 
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                        : 'bg-gray-100 border-gray-300 text-gray-800'
                                      }`}
                                    >
                                      {isFirst && (
                                        <div className="absolute -left-14 w-12 h-12 flex items-center justify-center font-bold text-lg bg-teal-100 rounded-lg border-2 border-teal-200">
                                          {v}
                                        </div>
                                      )}
                                      {pair}
                                    </div>
                                  )
                                })
                              ))}
                            </div>
                          </div>

                          {/* Simplified Punnett */}
                          <div className="flex justify-center mb-6">
                            <div 
                              className="grid gap-1"
                              style={{ gridTemplateColumns: 'repeat(3, 56px)' }}
                            >
                              <div></div>
                              {[result.parent2Genotype[0], result.parent2Genotype[1]].map((h, i) => (
                                <div key={`th-${i}`} className="w-14 h-10 flex items-center justify-center font-bold bg-teal-100 rounded border border-teal-200">
                                  {h}
                                </div>
                              ))}
                              {[result.parent1Genotype[0], result.parent1Genotype[1]].map((v, i) => (
                                <Fragment key={`row-${i}`}>
                                  <div className="w-10 h-14 flex items-center justify-center font-bold bg-teal-100 rounded border border-teal-200">
                                    {v}
                                  </div>
                                  {[result.parent2Genotype[0], result.parent2Genotype[1]].map((h, j) => {
                                    const pair = sortPair(v, h, result.domSymbol)
                                    const isDom = pair.includes(result.domSymbol)
                                    return (
                                      <div 
                                        key={`c-${i}-${j}`}
                                        className={`w-14 h-14 flex items-center justify-center font-mono font-bold rounded border-2 ${
                                          isDom 
                                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                            : 'bg-gray-100 border-gray-300 text-gray-600'
                                        }`}
                                      >
                                        {pair}
                                      </div>
                                    )
                                  })}
                                </Fragment>
                              ))}
                            </div>
                          </div>

                          {/* Results Summary */}
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                              <CardContent className="pt-4">
                                <h4 className="font-semibold text-emerald-800 mb-2">Hasil Fenotipe</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-emerald-700">{result.domPhen}</span>
                                    <Badge variant="secondary" className="bg-emerald-200 text-emerald-800">
                                      {result.phenotypeCounts.dominant}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">{result.recPhen}</span>
                                    <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                                      {result.phenotypeCounts.recessive}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                              <CardContent className="pt-4">
                                <h4 className="font-semibold text-teal-800 mb-2">Rasio</h4>
                                <div className="space-y-2 text-sm">
                                  <p>
                                    <strong>Fenotipe:</strong>{' '}
                                    {simplifyRatio([result.phenotypeCounts.dominant, result.phenotypeCounts.recessive])}
                                  </p>
                                  <p>
                                    <strong>Genotipe:</strong>{' '}
                                    {result.outcomes.map(o => `${o.genotype}(${o.count})`).join(' : ')}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Offspring Cards */}
                          <h4 className="font-semibold text-gray-800 mb-3">Keturunan (klik untuk generasi berikutnya)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {result.outcomes.map(({ genotype, count }) => {
                              const isDom = genotype.includes(result.domSymbol)
                              const phen = isDom ? result.domPhen : result.recPhen
                              const img = isDom ? dominantPhenotype?.image : recessivePhenotype?.image
                              const isSelected = nextParents?.geno === genotype && nextParents?.origin === result.label
                              
                              return (
                                <motion.div
                                  key={genotype}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card 
                                    className={`cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'ring-2 ring-emerald-500 bg-emerald-50' 
                                        : 'hover:shadow-md'
                                    }`}
                                    onClick={() => handleUseAsParent(genotype, phen, result.label)}
                                  >
                                    <CardContent className="p-3 text-center">
                                      <img 
                                        src={img} 
                                        alt={phen}
                                        className="w-12 h-12 mx-auto object-contain"
                                      />
                                      <p className="font-mono font-bold mt-1">{genotype}</p>
                                      <p className="text-xs text-gray-500">{phen}</p>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {count}/4
                                      </Badge>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )
                            })}
                          </div>

                          {nextParents && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200"
                            >
                              <p className="text-sm text-amber-800">
                                <strong>Parent dipilih:</strong> {nextParents.geno} dari {nextParents.origin}. 
                                Pilih parent lain dari generasi manapun untuk membuat generasi baru.
                              </p>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {generations.length === 0 && (
              <Card className="bg-white/80 backdrop-blur text-center py-12">
                <CardContent>
                  <Eye className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Hasil</h3>
                  <p className="text-gray-500">
                    Pilih organisme, sifat, dan parent untuk memulai simulasi persilangan.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
