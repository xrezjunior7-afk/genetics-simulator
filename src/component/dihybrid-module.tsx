'use client'

import { useState, useCallback, useMemo, useEffect, useRef, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Sparkles,
  Eye,
  Lightbulb,
  Users,
  Zap
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

interface TraitConfig {
  traitName: string
  dominantPhenotype: string
  recessivePhenotype: string
  dominantSymbol: string
  recessiveSymbol: string
  dominantImage: string
  recessiveImage: string
  domFirst: boolean
  // Store original options for toggling
  option0Phenotype: string
  option1Phenotype: string
  option0Image: string
  option1Image: string
}

interface GenerationResult {
  label: string
  parent1Genotype: string
  parent2Genotype: string
  outcomes: { genotype: string; count: number; phenos: string[] }[]
  phenotypeCategories: { label: string; count: number }[]
  traitConfigs: TraitConfig[]
}

interface DihybridModuleProps {
  data: ProjectData
  onBack: () => void
  onCrossComplete: (generation: number) => void
}

export function DihybridModule({ data, onBack, onCrossComplete }: DihybridModuleProps) {
  const [selectedOrganism, setSelectedOrganism] = useState<Subject | null>(null)
  const [selectedTraits, setSelectedTraits] = useState<number[]>([])
  const [traitConfigs, setTraitConfigs] = useState<TraitConfig[]>([])
  const [parent1Phenotypes, setParent1Phenotypes] = useState<string[]>(['', ''])
  const [parent2Phenotypes, setParent2Phenotypes] = useState<string[]>(['', ''])
  const [generations, setGenerations] = useState<GenerationResult[]>([])
  const [nextParents, setNextParents] = useState<{ geno: string; phenos: string[]; origin: string } | null>(null)
  
  // Track if simulation has started to enable auto-reset on config change
  const simulationStartedRef = useRef(false)

  // Auto-reset when configuration changes after simulation started
  // Dependencies: traitConfigs (symbols), parent1Phenotypes, parent2Phenotypes
  useEffect(() => {
    // Only reset if simulation has already started and results exist
    if (simulationStartedRef.current && generations.length > 0) {
      setGenerations([])
      setNextParents(null)
    }
  }, [traitConfigs, parent1Phenotypes, parent2Phenotypes])

  const handleOrganismChange = (value: string) => {
    const org = data.subjects.find(s => s.id === value)
    setSelectedOrganism(org || null)
    setSelectedTraits([])
    setTraitConfigs([])
    setGenerations([])
    setNextParents(null)
  }

  const handleTraitToggle = (traitIdx: number) => {
    setSelectedTraits(prev => {
      const newSelected = prev.includes(traitIdx)
        ? prev.filter(i => i !== traitIdx)
        : prev.length < 2 ? [...prev, traitIdx] : prev
      
      if (newSelected.length === 2) {
        const configs: TraitConfig[] = newSelected.map((idx, i) => {
          const trait = selectedOrganism!.traits[idx]
          return {
            traitName: trait.name,
            dominantPhenotype: trait.options[0].phenotype,
            recessivePhenotype: trait.options[1].phenotype,
            dominantSymbol: trait.defaultSymbols.dominant || String.fromCharCode(65 + i),
            recessiveSymbol: trait.defaultSymbols.recessive || String.fromCharCode(65 + i).toLowerCase(),
            dominantImage: trait.options[0].image,
            recessiveImage: trait.options[1].image,
            domFirst: true,
            // Store original options for toggling
            option0Phenotype: trait.options[0].phenotype,
            option1Phenotype: trait.options[1].phenotype,
            option0Image: trait.options[0].image,
            option1Image: trait.options[1].image
          }
        })
        setTraitConfigs(configs)
        setParent1Phenotypes([configs[0].dominantPhenotype, configs[1].dominantPhenotype])
        setParent2Phenotypes([configs[0].dominantPhenotype, configs[1].dominantPhenotype])
      } else {
        setTraitConfigs([])
      }
      
      return newSelected
    })
  }

  // Toggle which phenotype is dominant for a specific trait
  const toggleTraitDominance = (traitIdx: number, isFirstDominant: boolean) => {
    setTraitConfigs(prev => {
      const newConfigs = [...prev]
      const conf = newConfigs[traitIdx]
      
      if (isFirstDominant) {
        // First option is dominant
        newConfigs[traitIdx] = {
          ...conf,
          dominantPhenotype: conf.option0Phenotype,
          recessivePhenotype: conf.option1Phenotype,
          dominantImage: conf.option0Image,
          recessiveImage: conf.option1Image,
          domFirst: true
        }
      } else {
        // Second option is dominant
        newConfigs[traitIdx] = {
          ...conf,
          dominantPhenotype: conf.option1Phenotype,
          recessivePhenotype: conf.option0Phenotype,
          dominantImage: conf.option1Image,
          recessiveImage: conf.option0Image,
          domFirst: false
        }
      }
      
      return newConfigs
    })
    
    // Update parent phenotypes to match new dominance configuration
    setParent1Phenotypes(prev => {
      const newPhens = [...prev]
      newPhens[traitIdx] = traitConfigs[traitIdx].dominantPhenotype
      return newPhens
    })
    setParent2Phenotypes(prev => {
      const newPhens = [...prev]
      newPhens[traitIdx] = traitConfigs[traitIdx].dominantPhenotype
      return newPhens
    })
  }

  const updateTraitConfig = (idx: number, updates: Partial<TraitConfig>) => {
    setTraitConfigs(prev => {
      const newConfigs = [...prev]
      newConfigs[idx] = { ...newConfigs[idx], ...updates }
      return newConfigs
    })
  }

  const parent1Genotype = useMemo(() => {
    if (traitConfigs.length !== 2) return ''
    return traitConfigs.map((conf, i) => {
      const isDom = parent1Phenotypes[i] === conf.dominantPhenotype
      return isDom ? `${conf.dominantSymbol}${conf.dominantSymbol}` : `${conf.recessiveSymbol}${conf.recessiveSymbol}`
    }).join('')
  }, [traitConfigs, parent1Phenotypes])

  const parent2Genotype = useMemo(() => {
    if (traitConfigs.length !== 2) return ''
    return traitConfigs.map((conf, i) => {
      const isDom = parent2Phenotypes[i] === conf.dominantPhenotype
      return isDom ? `${conf.dominantSymbol}${conf.dominantSymbol}` : `${conf.recessiveSymbol}${conf.recessiveSymbol}`
    }).join('')
  }, [traitConfigs, parent2Phenotypes])

  const sortPair = useCallback((a: string, b: string, dom: string): string => {
    if (a === b) return a + b
    if (a === dom && b !== dom) return a + b
    if (b === dom && a !== dom) return b + a
    return a < b ? a + b : b + a
  }, [])

  const produceGametes = (geno: string): string[] => {
    const g1 = [geno[0], geno[1]]
    const g2 = [geno[2], geno[3]]
    const gametes: string[] = []
    g1.forEach(a => g2.forEach(b => gametes.push(a + b)))
    return gametes
  }

  const getPhenotypes = (geno: string, configs: TraitConfig[]): string[] => {
    return configs.map((conf, i) => {
      const pair = geno.substring(i * 2, i * 2 + 2)
      return pair.includes(conf.dominantSymbol) ? conf.dominantPhenotype : conf.recessivePhenotype
    })
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

  const createDihybridPunnett = useCallback((g1: string, g2: string, label: string): GenerationResult => {
    const gam1 = produceGametes(g1)
    const gam2 = produceGametes(g2)
    
    const outcomes: { genotype: string; count: number; phenos: string[] }[] = []
    const tally: Record<string, { count: number; phenos: string[] }> = {}
    
    gam1.forEach(gA => {
      gam2.forEach(gB => {
        const gene1 = sortPair(gA[0], gB[0], traitConfigs[0].dominantSymbol)
        const gene2 = sortPair(gA[1], gB[1], traitConfigs[1].dominantSymbol)
        const combined = gene1 + gene2
        const phenos = getPhenotypes(combined, traitConfigs)
        
        if (!tally[combined]) {
          tally[combined] = { count: 0, phenos }
        }
        tally[combined].count++
      })
    })
    
    Object.entries(tally).forEach(([genotype, data]) => {
      outcomes.push({ genotype, count: data.count, phenos: data.phenos })
    })
    
    // Calculate phenotype categories (9:3:3:1 pattern)
    const categories: Record<string, number> = {}
    outcomes.forEach(o => {
      const key = o.phenos.join(' + ')
      categories[key] = (categories[key] || 0) + o.count
    })
    
    const phenotypeCategories = Object.entries(categories).map(([label, count]) => ({ label, count }))
    
    return {
      label,
      parent1Genotype: g1,
      parent2Genotype: g2,
      outcomes,
      phenotypeCategories,
      traitConfigs
    }
  }, [traitConfigs, sortPair])

  const handleSimulate = () => {
    if (!parent1Genotype || !parent2Genotype || traitConfigs.length !== 2) return
    simulationStartedRef.current = true
    const result = createDihybridPunnett(parent1Genotype, parent2Genotype, 'F1')
    setGenerations([result])
    onCrossComplete(1)
  }

  const handleUseAsParent = (geno: string, phenos: string[], origin: string) => {
    if (!nextParents) {
      setNextParents({ geno, phenos, origin })
    } else {
      const originIdx = generations.findIndex(g => g.label === nextParents.origin)
      const newOriginIdx = generations.findIndex(g => g.label === origin)
      const baseIdx = Math.max(originIdx, newOriginIdx)
      const newGenNum = baseIdx + 2
      const newLabel = `F${newGenNum}`
      
      const newResult = createDihybridPunnett(nextParents.geno, geno, newLabel)
      setGenerations(prev => [...prev.slice(0, baseIdx + 1), newResult])
      setNextParents(null)
      onCrossComplete(newGenNum)
    }
  }

  const handleReset = () => {
    setGenerations([])
    setNextParents(null)
  }

  const simplifyRatio = (nums: number[]): string => {
    const validNums = nums.filter(n => n > 0)
    if (validNums.length === 0) return '0'
    const g = validNums.reduce((acc, n) => gcd(acc, n))
    return validNums.map(n => Math.round(n / g)).join(' : ')
  }

  const getParentImage = (phenotypes: string[]): string => {
    if (traitConfigs.length < 1) return ''
    const isDom = phenotypes[0] === traitConfigs[0].dominantPhenotype
    return isDom ? traitConfigs[0].dominantImage : traitConfigs[0].recessiveImage
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg">
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
              <Sparkles className="w-6 h-6" />
              <h1 className="text-xl font-bold">Persilangan Dihybrid</h1>
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
                  <Zap className="w-5 h-5 text-teal-500" />
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
                {selectedOrganism && selectedOrganism.traits.length < 2 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ Organisme ini hanya memiliki {selectedOrganism.traits.length} sifat
                  </p>
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
                    <CardTitle className="text-lg">Pilih 2 Sifat</CardTitle>
                    <CardDescription>
                      Pilih dua sifat untuk persilangan dihybrid
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedOrganism.traits.map((trait, idx) => (
                      <div 
                        key={trait.name}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <Checkbox 
                          id={`trait-${idx}`}
                          checked={selectedTraits.includes(idx)}
                          onCheckedChange={() => handleTraitToggle(idx)}
                          disabled={!selectedTraits.includes(idx) && selectedTraits.length >= 2}
                        />
                        <Label htmlFor={`trait-${idx}`} className="flex-1 cursor-pointer">
                          <span className="font-medium">{trait.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({trait.options[0].phenotype} / {trait.options[1].phenotype})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Trait Configuration */}
            {traitConfigs.length === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Konfigurasi Alel</CardTitle>
                    <CardDescription>Tentukan mana yang dominan untuk setiap sifat</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {traitConfigs.map((conf, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-3">
                        <div className="font-medium text-sm text-teal-700">{conf.traitName}</div>
                        
                        {/* Dominance Selection - RadioGroup */}
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Pilih fenotipe dominan:</Label>
                          <RadioGroup 
                            value={conf.domFirst ? 'first' : 'second'}
                            onValueChange={(v) => toggleTraitDominance(i, v === 'first')}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="first" id={`dom-${i}-first`} />
                              <Label htmlFor={`dom-${i}-first`} className="flex items-center gap-2 cursor-pointer">
                                <span className="font-medium">{conf.option0Phenotype}</span>
                                <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">Dominan</Badge>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="second" id={`dom-${i}-second`} />
                              <Label htmlFor={`dom-${i}-second`} className="flex items-center gap-2 cursor-pointer">
                                <span className="font-medium">{conf.option1Phenotype}</span>
                                <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs">Dominan</Badge>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Symbol Configuration */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Simbol Dominan</Label>
                            <Input 
                              value={conf.dominantSymbol}
                              onChange={(e) => updateTraitConfig(i, { 
                                dominantSymbol: e.target.value.toUpperCase().slice(0, 1) 
                              })}
                              maxLength={1}
                              className="text-center font-mono"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Simbol Resesif</Label>
                            <Input 
                              value={conf.recessiveSymbol}
                              onChange={(e) => updateTraitConfig(i, { 
                                recessiveSymbol: e.target.value.toLowerCase().slice(0, 1) 
                              })}
                              maxLength={1}
                              className="text-center font-mono"
                            />
                          </div>
                        </div>
                        
                        {/* Current Mapping */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="bg-teal-50 border-teal-200">
                            {conf.dominantPhenotype} = {conf.dominantSymbol}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100 border-gray-300">
                            {conf.recessivePhenotype} = {conf.recessiveSymbol}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Parent Selection */}
            {traitConfigs.length === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/90 backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-500" />
                      Pilih Parent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium">Parent 1</Label>
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <img 
                            src={getParentImage(parent1Phenotypes)} 
                            alt="Parent 1"
                            className="w-12 h-12 mx-auto object-contain"
                          />
                          <p className="text-xs font-mono mt-1">{parent1Genotype}</p>
                        </div>
                        {traitConfigs.map((conf, i) => (
                          <Select 
                            key={i}
                            value={parent1Phenotypes[i]} 
                            onValueChange={(v) => {
                              const newPhens = [...parent1Phenotypes]
                              newPhens[i] = v
                              setParent1Phenotypes(newPhens)
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={conf.dominantPhenotype}>{conf.dominantPhenotype}</SelectItem>
                              <SelectItem value={conf.recessivePhenotype}>{conf.recessivePhenotype}</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-medium">Parent 2</Label>
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <img 
                            src={getParentImage(parent2Phenotypes)} 
                            alt="Parent 2"
                            className="w-12 h-12 mx-auto object-contain"
                          />
                          <p className="text-xs font-mono mt-1">{parent2Genotype}</p>
                        </div>
                        {traitConfigs.map((conf, i) => (
                          <Select 
                            key={i}
                            value={parent2Phenotypes[i]} 
                            onValueChange={(v) => {
                              const newPhens = [...parent2Phenotypes]
                              newPhens[i] = v
                              setParent2Phenotypes(newPhens)
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={conf.dominantPhenotype}>{conf.dominantPhenotype}</SelectItem>
                              <SelectItem value={conf.recessivePhenotype}>{conf.recessivePhenotype}</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleSimulate}
                      disabled={!parent1Genotype || !parent2Genotype}
                      className="w-full bg-teal-600 hover:bg-teal-700"
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
                                <Badge variant="default" className="bg-teal-600">
                                  {result.label}
                                </Badge>
                                <span className="text-lg">
                                  {result.parent1Genotype} × {result.parent2Genotype}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                Tabel Punnett 4×4 - Persilangan Dihybrid
                              </CardDescription>
                            </div>
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Punnett 4x4 Grid */}
                          <div className="flex justify-center mb-6 overflow-x-auto">
                            <div 
                              className="grid gap-0.5"
                              style={{ gridTemplateColumns: 'repeat(5, minmax(40px, 50px))' }}
                            >
                              {/* Header row */}
                              <div className="w-10 h-10"></div>
                              {produceGametes(result.parent2Genotype).map((h, i) => (
                                <div 
                                  key={`h-${i}`}
                                  className="w-12 h-10 flex items-center justify-center font-bold text-sm bg-cyan-100 rounded border border-cyan-200"
                                >
                                  {h}
                                </div>
                              ))}
                              {/* Data rows */}
                              {produceGametes(result.parent1Genotype).map((v, i) => (
                                <Fragment key={`row-${i}`}>
                                  <div 
                                    className="w-10 h-12 flex items-center justify-center font-bold text-sm bg-cyan-100 rounded border border-cyan-200"
                                  >
                                    {v}
                                  </div>
                                  {produceGametes(result.parent2Genotype).map((h, j) => {
                                    const gene1 = sortPair(v[0], h[0], result.traitConfigs[0].dominantSymbol)
                                    const gene2 = sortPair(v[1], h[1], result.traitConfigs[1].dominantSymbol)
                                    const combined = gene1 + gene2
                                    const phenos = getPhenotypes(combined, result.traitConfigs)
                                    const isDom0 = phenos[0] === result.traitConfigs[0].dominantPhenotype
                                    const isDom1 = phenos[1] === result.traitConfigs[1].dominantPhenotype
                                    
                                    let bgColor = 'bg-gray-100 border-gray-300'
                                    if (isDom0 && isDom1) bgColor = 'bg-emerald-100 border-emerald-300'
                                    else if (isDom0) bgColor = 'bg-teal-100 border-teal-300'
                                    else if (isDom1) bgColor = 'bg-cyan-100 border-cyan-300'
                                    
                                    return (
                                      <div 
                                        key={`c-${i}-${j}`}
                                        className={`w-12 h-12 flex items-center justify-center font-mono text-xs font-bold rounded border ${bgColor}`}
                                      >
                                        {combined}
                                      </div>
                                    )
                                  })}
                                </Fragment>
                              ))}
                            </div>
                          </div>

                          {/* Phenotype Categories */}
                          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 mb-4">
                            <CardContent className="pt-4">
                              <h4 className="font-semibold text-teal-800 mb-3">Kategori Fenotipe (Pola 9:3:3:1)</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {result.phenotypeCategories
                                  .sort((a, b) => b.count - a.count)
                                  .map((cat, i) => (
                                    <div key={i} className="text-center p-2 bg-white/60 rounded-lg">
                                      <p className="text-xs text-gray-600">{cat.label}</p>
                                      <p className="text-xl font-bold text-teal-700">{cat.count}</p>
                                    </div>
                                  ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-3">
                                <strong>Rasio:</strong> {simplifyRatio(result.phenotypeCategories.map(c => c.count))}
                              </p>
                            </CardContent>
                          </Card>

                          {/* Offspring Grid */}
                          <h4 className="font-semibold text-gray-800 mb-3">Keturunan (klik untuk generasi berikutnya)</h4>
                          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
                            {result.outcomes.map(({ genotype, count, phenos }) => {
                              const isSelected = nextParents?.geno === genotype && nextParents?.origin === result.label
                              const isDom0 = phenos[0] === result.traitConfigs[0].dominantPhenotype
                              const img = isDom0 ? result.traitConfigs[0].dominantImage : result.traitConfigs[0].recessiveImage
                              
                              return (
                                <motion.div
                                  key={genotype}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Card 
                                    className={`cursor-pointer transition-all text-center p-2 ${
                                      isSelected 
                                        ? 'ring-2 ring-teal-500 bg-teal-50' 
                                        : 'hover:shadow-md'
                                    }`}
                                    onClick={() => handleUseAsParent(genotype, phenos, result.label)}
                                  >
                                    <img 
                                      src={img} 
                                      alt={phenos.join(' ')}
                                      className="w-8 h-8 mx-auto object-contain"
                                    />
                                    <p className="font-mono text-xs font-bold">{genotype}</p>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {count}
                                    </Badge>
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
                                <strong>Parent dipilih:</strong> {nextParents.geno} ({nextParents.phenos.join(' + ')}) dari {nextParents.origin}
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
                    Pilih organisme, 2 sifat, dan parent untuk memulai simulasi persilangan dihybrid.
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
